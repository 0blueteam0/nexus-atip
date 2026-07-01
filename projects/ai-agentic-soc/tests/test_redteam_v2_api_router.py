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
            "approver": "control@example.com",
            "approver_role": "control_team",
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

    def test_v2_t4_rejects_unauthorized_approver_role(self) -> None:
        plan = self.client.post("/api/redteam/v2/tool-actions/plan", json={
            "case_id": "CASE-V2-APPROVAL-ROLE-001",
            "campaign_id": "CAMP-V2",
            "title": "Control-team approval required",
            "objective": "Verify T4 cannot be approved by an analyst role",
            "risk_class": "T4",
            "target_scope_refs": ["SCOPE-APPROVED-001"],
        })
        action = plan.json()
        request = self.client.post(f"/api/redteam/v2/tool-actions/{action['action_id']}/request-approval", json={
            "case_id": "CASE-V2-APPROVAL-ROLE-001",
            "requested_by": "analyst@example.com",
            "justification": "T4 requires control team approval.",
        })
        self.assertEqual(request.json()["status"], "ApprovalRequested")

        approval = self.client.post(f"/api/redteam/v2/tool-actions/{action['action_id']}/approve", json={
            "case_id": "CASE-V2-APPROVAL-ROLE-001",
            "approver": "analyst@example.com",
            "approver_role": "analyst",
            "decision": "approve",
        })
        self.assertEqual(approval.status_code, 200)
        body = approval.json()
        self.assertEqual(body["status"], "invalid")
        self.assertIn("approver_role_not_authorized", body["errors"])
        self.assertEqual(body["action"]["status"], "ApprovalRequested")

    def test_v2_t5_requires_two_distinct_approvers_before_manual_run(self) -> None:
        plan = self.client.post("/api/redteam/v2/tool-actions/plan", json={
            "case_id": "CASE-V2-T5-TWO-PERSON-001",
            "campaign_id": "CAMP-V2",
            "title": "T5 controlled production emulation",
            "objective": "Verify two-person approval hard gate",
            "risk_class": "T5",
            "environment": "controlled_production_execute",
            "target_scope_refs": ["SCOPE-APPROVED-001"],
            "control_team_override": True,
        })
        self.assertEqual(plan.status_code, 200)
        action = plan.json()
        self.assertEqual(action["status"], "ScopeValidated")
        self.assertEqual(action["required_approver_roles"], ["control_team", "second_approver"])

        request = self.client.post(f"/api/redteam/v2/tool-actions/{action['action_id']}/request-approval", json={
            "case_id": "CASE-V2-T5-TWO-PERSON-001",
            "requested_by": "analyst@example.com",
            "justification": "T5 requires two-person approval.",
        })
        self.assertEqual(request.json()["status"], "ApprovalRequested")

        first = self.client.post(f"/api/redteam/v2/tool-actions/{action['action_id']}/approve", json={
            "case_id": "CASE-V2-T5-TWO-PERSON-001",
            "approver": "control@example.com",
            "approver_role": "control_team",
            "decision": "approve",
        })
        self.assertEqual(first.json()["status"], "PartiallyApproved")

        blocked_run = self.client.post(f"/api/redteam/v2/tool-actions/{action['action_id']}/manual-run-record", json={
            "case_id": "CASE-V2-T5-TWO-PERSON-001",
            "executed_by": "operator@example.com",
            "started_at": "2026-07-01T00:00:00Z",
            "ended_at": "2026-07-01T00:05:00Z",
            "uploaded_artifacts": ["artifact://t5-partial.txt"],
        })
        self.assertIn("approval_required_before_manual_run", blocked_run.json()["errors"])

        same_actor = self.client.post(f"/api/redteam/v2/tool-actions/{action['action_id']}/approve", json={
            "case_id": "CASE-V2-T5-TWO-PERSON-001",
            "approver": "control@example.com",
            "approver_role": "second_approver",
            "decision": "approve",
        })
        self.assertEqual(same_actor.json()["status"], "invalid")
        self.assertIn("two_person_approval_requires_distinct_approvers", same_actor.json()["errors"])

        second = self.client.post(f"/api/redteam/v2/tool-actions/{action['action_id']}/approve", json={
            "case_id": "CASE-V2-T5-TWO-PERSON-001",
            "approver": "second@example.com",
            "approver_role": "second_approver",
            "decision": "approve",
        })
        self.assertEqual(second.json()["status"], "Approved")

        allowed_run = self.client.post(f"/api/redteam/v2/tool-actions/{action['action_id']}/manual-run-record", json={
            "case_id": "CASE-V2-T5-TWO-PERSON-001",
            "executed_by": "operator@example.com",
            "started_at": "2026-07-01T00:00:00Z",
            "ended_at": "2026-07-01T00:05:00Z",
            "uploaded_artifacts": ["artifact://t5-approved.txt"],
        })
        self.assertEqual(allowed_run.json()["status"], "ManuallyExecuted")
        self.assertFalse(allowed_run.json()["errors"])

    def test_v2_manual_run_promotes_uploaded_artifacts_to_evidence_candidates(self) -> None:
        plan = self.client.post("/api/redteam/v2/tool-actions/plan", json={
            "case_id": "CASE-V2-MANUAL-001",
            "campaign_id": "CAMP-V2",
            "title": "Low-risk manual artifact import",
            "objective": "Verify manual run is tied to a ToolActionCard",
            "risk_class": "T2",
            "target_scope_refs": ["SCOPE-APPROVED-001"],
        })
        action = plan.json()
        response = self.client.post(f"/api/redteam/v2/tool-actions/{action['action_id']}/manual-run-record", json={
            "case_id": "CASE-V2-MANUAL-001",
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

    def test_v2_manual_run_without_tool_action_card_is_invalid(self) -> None:
        response = self.client.post("/api/redteam/v2/tool-actions/TAC-MISSING/manual-run-record", json={
            "case_id": "CASE-V2-MISSING-ACTION-001",
            "executed_by": "analyst@example.com",
            "started_at": "2026-07-01T00:00:00Z",
            "ended_at": "2026-07-01T00:10:00Z",
            "uploaded_artifacts": ["artifact://tool-output.json"],
        })

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["status"], "invalid")
        self.assertIn("tool_action_card_required_before_manual_run", body["errors"])

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
