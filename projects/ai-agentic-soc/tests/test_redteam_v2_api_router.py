from __future__ import annotations

import importlib
import sys
import unittest
from pathlib import Path

from fastapi.testclient import TestClient


PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))


class RedTeamV2ApiRouterTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        module = importlib.import_module("runtime.malware_upload_api")
        cls.client = TestClient(module.app)

    def test_v2_health_advertises_safe_tool_action_policy(self) -> None:
        response = self.client.get("/api/redteam/v2/health")

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["kind"], "redteam_ax_v2_health")
        self.assertTrue(body["safe_by_default"])
        self.assertEqual(body["execution_policy"], "tool_action_card_required")
        self.assertEqual(body["high_risk_mode"], "human_approved_manual_run")

    def test_v2_roe_denies_missing_scope_and_t5_without_override(self) -> None:
        response = self.client.post("/api/redteam/v2/roe/evaluate", json={
            "case_id": "CASE-V2-001",
            "risk_class": "T5",
            "target_scope_refs": [],
        })

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["decision"], "deny")
        self.assertTrue(body["hitl_required"])
        self.assertIn("target_scope_refs_required", body["failures"])
        self.assertIn("t5_requires_control_team_override", body["failures"])

    def test_v2_tool_action_plan_high_risk_requires_hitl_without_direct_run(self) -> None:
        response = self.client.post("/api/redteam/v2/tool-actions/plan", json={
            "case_id": "CASE-V2-002",
            "campaign_id": "CAMP-V2",
            "title": "Approved manual evidence collection",
            "objective": "Collect evidence under ROE and link it to claims",
            "risk_class": "T3",
            "target_scope_refs": ["SCOPE-APPROVED-001"],
        })

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["kind"], "redteam_ax_v2_tool_action_card")
        self.assertEqual(body["status"], "ScopeValidated")
        self.assertTrue(body["approval_required"])
        self.assertTrue(body["hitl_required"])
        self.assertIn("Request Approval", body["allowed_buttons"])
        self.assertNotIn("Run in Lab", body["allowed_buttons"])

    def test_v2_tool_action_approval_queue_persists_and_updates_action_status(self) -> None:
        plan = self.client.post("/api/redteam/v2/tool-actions/plan", json={
            "case_id": "CASE-V2-APPROVAL-001",
            "campaign_id": "CAMP-V2",
            "title": "High risk lab action requiring approval",
            "objective": "Prepare a human-approved lab action under ROE",
            "risk_class": "T4",
            "target_scope_refs": ["SCOPE-APPROVED-001"],
        })
        self.assertEqual(plan.status_code, 200)
        action = plan.json()

        request = self.client.post(f"/api/redteam/v2/tool-actions/{action['action_id']}/request-approval", json={
            "case_id": "CASE-V2-APPROVAL-001",
            "requested_by": "analyst@example.com",
            "justification": "High-risk action must be reviewed before any lab execution.",
        })
        self.assertEqual(request.status_code, 200)
        requested = request.json()
        self.assertEqual(requested["status"], "ApprovalRequested")
        self.assertEqual(requested["action"]["status"], "ApprovalRequested")
        self.assertIn("control_team", requested["required_approvers"])

        listed = self.client.get("/api/redteam/v2/tool-actions", params={"case_id": "CASE-V2-APPROVAL-001"})
        self.assertEqual(listed.status_code, 200)
        listed_body = listed.json()
        self.assertGreaterEqual(listed_body["count"], 1)
        self.assertEqual(listed_body["items"][0]["status"], "ApprovalRequested")
        self.assertTrue(Path(listed_body["items"][0]["artifact_path"]).exists())

        approval = self.client.post(f"/api/redteam/v2/tool-actions/{action['action_id']}/approve", json={
            "case_id": "CASE-V2-APPROVAL-001",
            "approver": "lead@example.com",
            "decision": "approve",
            "conditions": ["manual_run_only", "upload_artifacts_before_evidence"],
        })
        self.assertEqual(approval.status_code, 200)
        approved = approval.json()
        self.assertEqual(approved["status"], "Approved")
        self.assertEqual(approved["action"]["status"], "Approved")
        self.assertIn("Run in Lab", approved["action"]["allowed_buttons"])

        reloaded = self.client.get(f"/api/redteam/v2/tool-actions/{action['action_id']}", params={"case_id": "CASE-V2-APPROVAL-001"})
        self.assertEqual(reloaded.status_code, 200)
        self.assertEqual(reloaded.json()["status"], "Approved")
        self.assertTrue(Path(reloaded.json()["artifact_path"]).exists())

    def test_v2_manual_run_promotes_uploaded_artifacts_to_evidence_candidates(self) -> None:
        response = self.client.post("/api/redteam/v2/tool-actions/TAC-UNIT/manual-run-record", json={
            "executed_by": "analyst@example.com",
            "started_at": "2026-07-01T00:00:00Z",
            "ended_at": "2026-07-01T00:10:00Z",
            "notes": "Performed by human operator under approved ROE.",
            "uploaded_artifacts": ["artifact://screen-001.png", "artifact://tool-output.json"],
        })

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["status"], "ManuallyExecuted")
        self.assertEqual(body["normalized_result"]["evidence_candidate_count"], 2)
        self.assertEqual(len(body["evidence_candidates"]), 2)

    def test_v2_report_gate_blocks_unsupported_claims_unapproved_high_risk_and_evidenceless_findings(self) -> None:
        response = self.client.post("/api/redteam/v2/reports/validate", json={
            "claims": [{"claim_id": "C-1", "support_level": "unsupported", "evidence_ids": []}],
            "findings": [{"finding_id": "F-1", "evidence_ids": []}],
            "tool_actions": [{"action_id": "TAC-1", "risk_class": "T4", "approval_required": True, "status": "ScopeValidated"}],
        })

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["gate_status"], "blocked")
        self.assertEqual(body["unsupported_claim_count"], 1)
        self.assertEqual(body["unapproved_high_risk_count"], 1)
        self.assertEqual(body["finding_without_evidence_count"], 1)

    def test_v2_report_generate_passes_only_when_all_gate_counts_are_zero(self) -> None:
        response = self.client.post("/api/redteam/v2/reports/generate", json={
            "title": "Korean Red Team Report v2",
            "claims": [{"claim_id": "C-1", "support_level": "supported", "evidence_ids": ["EV-1"]}],
            "findings": [{"finding_id": "F-1", "evidence_ids": ["EV-1"]}],
            "tool_actions": [{"action_id": "TAC-1", "risk_class": "T3", "approval_required": True, "status": "EvidenceCreated"}],
        })

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["gate_status"], "pass")
        self.assertIsNotNone(body["report"])
        self.assertIn("Claim-Evidence Matrix", body["report"]["sections"])


if __name__ == "__main__":
    unittest.main()
