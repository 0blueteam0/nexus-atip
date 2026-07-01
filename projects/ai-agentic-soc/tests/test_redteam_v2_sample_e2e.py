from __future__ import annotations

import importlib
import sys
import unittest
from pathlib import Path

from fastapi.testclient import TestClient


PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))


class RedTeamV2SampleE2ETests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        module = importlib.import_module("runtime.malware_upload_api")
        cls.client = TestClient(module.app)

    def test_sample_case_reaches_report_v2_gate_with_zero_blockers(self) -> None:
        case_id = "CASE-V2-E2E-001"
        plan = self.client.post("/api/redteam/v2/tool-actions/plan", json={
            "case_id": case_id,
            "campaign_id": "CAMP-V2-E2E",
            "title": "Loopback report-studio evidence collection",
            "objective": "Create evidence for a Korean Red Team Report v2 sample case under approved ROE",
            "risk_class": "T3",
            "target_scope_refs": ["SCOPE-APPROVED-LOOPBACK-001"],
            "inputs": {"target": "http://127.0.0.1:5177/reports", "target_type": "url"},
            "expected_outputs": ["manual_run_record", "screenshot", "evidence_card", "claim_evidence_matrix"],
            "requested_by": "sample-e2e",
        })
        self.assertEqual(plan.status_code, 200)
        action = plan.json()
        self.assertEqual(action["roe_evaluation"]["decision"], "allow")
        self.assertTrue(action["hitl_required"])

        manual_run = self.client.post(f"/api/redteam/v2/tool-actions/{action['action_id']}/manual-run-record", json={
            "executed_by": "analyst@example.com",
            "started_at": "2026-07-01T03:40:00Z",
            "ended_at": "2026-07-01T03:45:00Z",
            "notes": "Human analyst captured the Report Studio redteam2 screen and exported console-safe metadata.",
            "uploaded_artifacts": [
                "artifact://redteam2-report-studio-after-api.png",
                "artifact://redteam2-api-live-smoke.json",
            ],
        })
        self.assertEqual(manual_run.status_code, 200)
        run = manual_run.json()
        self.assertEqual(run["status"], "ManuallyExecuted")
        self.assertEqual(run["normalized_result"]["evidence_candidate_count"], 2)

        evidence = self.client.post("/api/redteam/v2/evidence", json={
            "case_id": case_id,
            "source_type": "visual_capture",
            "source_path_or_url": run["evidence_candidates"][0]["source_path_or_ref"],
            "summary": "Report Studio displays the RedTeam AX v2 workbench with ToolActionCard and evidence gates.",
            "normalized_fields": {
                "observed_or_inferred": "observed",
                "supports": ["C-E2E-001", "F-E2E-001"],
            },
            "validation_status": "approved",
        })
        self.assertEqual(evidence.status_code, 200)
        evidence_card = evidence.json()
        self.assertEqual(evidence_card["validation_status"], "approved")
        self.assertFalse(evidence_card["errors"])

        validation_payload = {
            "claims": [{
                "claim_id": "C-E2E-001",
                "support_level": "supported",
                "evidence_ids": [evidence_card["evidence_id"]],
            }],
            "findings": [{
                "finding_id": "F-E2E-001",
                "title": "Report Studio v2 workbench is evidence-gated",
                "evidence_ids": [evidence_card["evidence_id"]],
            }],
            "tool_actions": [{
                "action_id": action["action_id"],
                "risk_class": action["risk_class"],
                "approval_required": action["approval_required"],
                "status": "EvidenceCreated",
            }],
        }
        validation = self.client.post("/api/redteam/v2/reports/validate", json=validation_payload)
        self.assertEqual(validation.status_code, 200)
        gate = validation.json()
        self.assertEqual(gate["gate_status"], "pass")
        self.assertEqual(gate["unsupported_claim_count"], 0)
        self.assertEqual(gate["unapproved_high_risk_count"], 0)
        self.assertEqual(gate["finding_without_evidence_count"], 0)

        report = self.client.post("/api/redteam/v2/reports/generate", json={
            "title": "CASE-V2-E2E-001 Korean Red Team Report v2",
            **validation_payload,
        })
        self.assertEqual(report.status_code, 200)
        body = report.json()
        self.assertEqual(body["gate_status"], "pass")
        self.assertEqual(body["validation"]["blocking_items"], [])
        self.assertIn("캠페인 Walkthrough", body["report"]["sections"])
        self.assertIn("문서 통제", body["report"]["sections"])
        self.assertIn("Claim-Evidence Matrix", body["report"]["sections"])


if __name__ == "__main__":
    unittest.main()
