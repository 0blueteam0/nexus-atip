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

    @staticmethod
    def actor_headers(actor: str, role: str) -> dict[str, str]:
        return {
            "X-RedTeam-Actor": actor,
            "X-RedTeam-Actor-Role": role,
        }

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

        approval_request = self.client.post(f"/api/redteam/v2/tool-actions/{action['action_id']}/request-approval", json={
            "case_id": case_id,
            "requested_by": "analyst@example.com",
            "justification": "Sample E2E high-risk action requires explicit HITL approval before manual execution.",
        })
        self.assertEqual(approval_request.status_code, 200)
        self.assertEqual(approval_request.json()["status"], "ApprovalRequested")

        approval_decision = self.client.post(
            f"/api/redteam/v2/tool-actions/{action['action_id']}/approve",
            headers=self.actor_headers("lead@example.com", "red_team_lead"),
            json={
                "case_id": case_id,
                "approver": "lead@example.com",
                "approver_role": "red_team_lead",
                "decision": "approve",
                "conditions": ["manual_run_only", "evidence_upload_required"],
            },
        )
        self.assertEqual(approval_decision.status_code, 200)
        approved_action = approval_decision.json()["action"]
        self.assertEqual(approved_action["status"], "Approved")

        queue = self.client.get("/api/redteam/v2/tool-actions", params={"case_id": case_id})
        self.assertEqual(queue.status_code, 200)
        self.assertGreaterEqual(queue.json()["count"], 1)

        manual_run = self.client.post(f"/api/redteam/v2/tool-actions/{action['action_id']}/manual-run-record", json={
            "case_id": case_id,
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
        self.assertTrue(Path(run["artifact_path"]).exists())

        imported = self.client.post(f"/api/redteam/v2/tool-runs/{run['run_id']}/import-output", json={
            "case_id": case_id,
            "raw_artifacts": [
                {"source_path_or_ref": "artifact://redteam2-report-studio-after-api.png", "content_type": "image/png", "summary": "Report Studio screenshot"},
                {"source_path_or_ref": "artifact://redteam2-api-live-smoke.json", "content_type": "application/json", "summary": "v2 API smoke metadata"},
            ],
        })
        self.assertEqual(imported.status_code, 200)
        self.assertEqual(imported.json()["status"], "OutputImported")

        normalized = self.client.post(f"/api/redteam/v2/tool-runs/{run['run_id']}/normalize", json={
            "case_id": case_id,
            "result_type": "visual_capture",
            "summary": "Report Studio displays the RedTeam AX v2 workbench with ToolActionCard and evidence gates.",
            "observations": ["The redteam2 queue and guardrail gate are visible."],
            "limitations": ["UI screenshot supports workflow presence, not exploit success."],
            "structured_items": [{
                "item_type": "screenshot",
                "source_path_or_ref": "artifact://redteam2-report-studio-after-api.png",
                "supports": ["C-E2E-001", "F-E2E-001"],
                "confidence": 0.9,
            }],
        })
        self.assertEqual(normalized.status_code, 200)
        normalized_result = normalized.json()
        self.assertEqual(normalized_result["status"], "Normalized")

        evidence = self.client.post(f"/api/redteam/v2/tool-runs/{run['run_id']}/create-evidence", json={
            "case_id": case_id,
            "result_id": normalized_result["result_id"],
            "summary": "Report Studio displays the RedTeam AX v2 workbench with ToolActionCard and evidence gates.",
        })
        self.assertEqual(evidence.status_code, 200)
        evidence_card = evidence.json()
        self.assertEqual(evidence_card["validation_status"], "candidate")
        self.assertFalse(evidence_card["errors"])
        self.assertTrue(Path(evidence_card["artifact_path"]).exists())

        evidence_approval = self.client.post(
            f"/api/redteam/v2/evidence/{evidence_card['evidence_id']}/approve",
            headers=self.actor_headers("lead@example.com", "red_team_lead"),
            json={
                "case_id": case_id,
                "reviewed_by": "lead@example.com",
                "reviewer_role": "red_team_lead",
                "decision": "approve",
            },
        )
        self.assertEqual(evidence_approval.status_code, 200)
        approved_evidence = evidence_approval.json()["evidence"]
        self.assertEqual(evidence_approval.json()["status"], "approved")
        self.assertEqual(approved_evidence["approval_status"], "approved")

        validation_payload = {
            "case_id": case_id,
            "claims": [{
                "claim_id": "C-E2E-001",
                "support_level": "supported",
                "evidence_ids": [approved_evidence["evidence_id"]],
            }],
            "findings": [{
                "finding_id": "F-E2E-001",
                "title": "Report Studio v2 workbench is evidence-gated",
                "evidence_ids": [approved_evidence["evidence_id"]],
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
        self.assertEqual(gate["unapproved_evidence_count"], 0)
        self.assertEqual(gate["unverified_evidence_count"], 0)
        self.assertTrue(Path(gate["artifact_path"]).exists())

        report = self.client.post("/api/redteam/v2/reports/generate", json={
            "case_id": case_id,
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
        report_path = Path(body["report"]["artifact_path"])
        self.assertTrue(report_path.exists())
        report_text = report_path.read_text(encoding="utf-8")
        self.assertIn("## 문서 통제", report_text)
        self.assertIn("## Campaign Walkthrough", report_text)
        self.assertIn("## Claim-Evidence Matrix", report_text)
        self.assertIn("Unsupported claims: `0`", report_text)
        self.assertIn("Unapproved high-risk actions: `0`", report_text)
        self.assertIn("Findings without evidence: `0`", report_text)
        self.assertIn("Unapproved evidence: `0`", report_text)
        self.assertIn("Unverified evidence: `0`", report_text)

        blocked_export = self.client.post(f"/api/redteam/v2/reports/{body['report_id']}/export", json={
            "case_id": case_id,
        })
        self.assertEqual(blocked_export.status_code, 200)
        self.assertEqual(blocked_export.json()["status"], "blocked")
        self.assertIn("report_export_approval_required", blocked_export.json()["errors"])

        approval = self.client.post(
            f"/api/redteam/v2/reports/{body['report_id']}/approve-export",
            headers=self.actor_headers("executive-sponsor@example.com", "executive_sponsor"),
            json={
                "case_id": case_id,
                "approved_by": "executive-sponsor@example.com",
                "approver_role": "executive_sponsor",
            },
        )
        self.assertEqual(approval.status_code, 200)
        approval_body = approval.json()
        self.assertEqual(approval_body["status"], "ExportApproved")
        self.assertEqual(approval_body["identity_binding"], "bound")
        self.assertEqual(approval_body["gate_snapshot"]["finding_without_evidence_count"], 0)

        exported = self.client.post(f"/api/redteam/v2/reports/{body['report_id']}/export", json={
            "case_id": case_id,
            "approval_id": approval_body["approval_id"],
        })
        self.assertEqual(exported.status_code, 200)
        exported_body = exported.json()
        self.assertEqual(exported_body["status"], "Exported")
        self.assertEqual(exported_body["approved_by"], "executive-sponsor@example.com")
        self.assertTrue(Path(exported_body["artifact_path"]).exists())


if __name__ == "__main__":
    unittest.main()
