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

    @staticmethod
    def actor_headers(actor: str, role: str) -> dict[str, str]:
        return {
            "X-RedTeam-Actor": actor,
            "X-RedTeam-Actor-Role": role,
        }

    @staticmethod
    def session_headers(actor: str) -> dict[str, str]:
        return {
            "X-RedTeam-Session": f"dev:{actor}",
        }

    def create_approved_evidence(self, case_id: str, evidence_id: str = "EV-APPROVED-1") -> dict:
        evidence = self.client.post("/api/redteam/v2/evidence", json={
            "case_id": case_id,
            "evidence_id": evidence_id,
            "source_path_or_url": f"artifact://{case_id}/{evidence_id}.json",
            "summary": f"Approved evidence fixture {evidence_id}",
        })
        self.assertEqual(evidence.status_code, 200)
        approval = self.client.post(
            f"/api/redteam/v2/evidence/{evidence_id}/approve",
            headers=self.actor_headers("lead@example.com", "red_team_lead"),
            json={
                "case_id": case_id,
                "reviewed_by": "lead@example.com",
                "reviewer_role": "red_team_lead",
                "decision": "approve",
            },
        )
        self.assertEqual(approval.status_code, 200)
        approval_body = approval.json()
        self.assertEqual(approval_body["status"], "approved")
        self.assertEqual(approval_body["identity_binding"], "bound")
        return approval_body["evidence"]

    def create_approved_finding(self, case_id: str, finding_id: str, evidence_id: str, severity: str = "medium") -> dict:
        finding = self.client.post("/api/redteam/v2/findings", json={
            "case_id": case_id,
            "finding_id": finding_id,
            "title": f"Approved finding fixture {finding_id}",
            "severity_draft": severity,
            "evidence_ids": [evidence_id],
            "root_cause": ["configuration_gap"],
            "business_impact": "Authorized sample impact statement.",
            "owner": "Security Engineering",
            "sla": "30 days",
            "retest_criteria": "Evidence-linked retest confirms remediation.",
            "affected_business_process": ["Report Studio validation"],
        })
        self.assertEqual(finding.status_code, 200)
        self.assertEqual(finding.json()["status"], "pending_review")

        lead = self.client.post(
            f"/api/redteam/v2/findings/{finding_id}/approve-severity",
            headers=self.actor_headers("lead@example.com", "red_team_lead"),
            json={
                "case_id": case_id,
                "approved_by": "lead@example.com",
                "approver_role": "red_team_lead",
                "severity_final": severity,
            },
        )
        self.assertEqual(lead.status_code, 200)
        self.assertEqual(lead.json()["status"], "pending")

        owner = self.client.post(
            f"/api/redteam/v2/findings/{finding_id}/approve-severity",
            headers=self.actor_headers("owner@example.com", "business_owner"),
            json={
                "case_id": case_id,
                "approved_by": "owner@example.com",
                "approver_role": "business_owner",
                "severity_final": severity,
            },
        )
        self.assertEqual(owner.status_code, 200)
        owner_body = owner.json()
        self.assertEqual(owner_body["status"], "approved")
        self.assertEqual(owner_body["finding"]["approval_status"], "approved")
        self.assertEqual(owner_body["finding"]["severity_final"], severity)
        return owner_body["finding"]

    def test_v2_health_advertises_safe_tool_action_policy(self) -> None:
        response = self.client.get("/api/redteam/v2/health")

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["kind"], "redteam_ax_v2_health")
        self.assertTrue(body["safe_by_default"])
        self.assertEqual(body["execution_policy"], "tool_action_card_required")
        self.assertEqual(body["high_risk_mode"], "human_approved_manual_run")
        self.assertEqual(body["actor_context_provider"], "local_dev_session_or_request_headers")

    def test_v2_actor_context_provider_resolves_registered_actor_and_blocks_wrong_role(self) -> None:
        resolved = self.client.post(
            "/api/redteam/v2/auth/actor-context",
            headers=self.session_headers("lead@example.com"),
            json={"case_id": "CASE-V2-ACTOR-CONTEXT-001", "approver_role": "red_team_lead"},
        )
        self.assertEqual(resolved.status_code, 200)
        body = resolved.json()
        self.assertEqual(body["status"], "authenticated")
        self.assertEqual(body["actor_context"]["actor_id"], "lead@example.com")
        self.assertEqual(body["actor_context"]["actor_role"], "red_team_lead")
        self.assertEqual(body["actor_context"]["case_roles"], ["red_team_lead"])
        self.assertIn("finding:approve_severity", body["actor_context"]["permissions"])

        wrong_role = self.client.post(
            "/api/redteam/v2/auth/actor-context",
            headers=self.session_headers("lead@example.com"),
            json={"case_id": "CASE-V2-ACTOR-CONTEXT-001", "approver_role": "executive_sponsor"},
        )
        self.assertEqual(wrong_role.status_code, 200)
        wrong_body = wrong_role.json()
        self.assertEqual(wrong_body["status"], "invalid")
        self.assertIn("actor_role_not_authorized_for_actor", wrong_body["errors"])

    def test_v2_case_rbac_policy_lists_case_scoped_assignments(self) -> None:
        response = self.client.get("/api/redteam/v2/cases/CASE-V2-RBAC-001/rbac")

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["kind"], "redteam_ax_v2_case_rbac_policy")
        self.assertEqual(body["policy_source"], "local_case_assignment_registry")
        lead = next(item for item in body["assignments"] if item["actor_id"] == "lead@example.com")
        self.assertEqual(lead["roles"], ["red_team_lead"])
        self.assertIn("finding:approve_severity", lead["permissions"])

    def test_v2_case_scoped_rbac_blocks_actor_not_assigned_to_case(self) -> None:
        plan = self.client.post("/api/redteam/v2/tool-actions/plan", json={
            "case_id": "CASE-NO-RBAC-001",
            "campaign_id": "CAMP-V2",
            "title": "Unassigned case RBAC rejection",
            "objective": "Verify actors cannot approve cases where they are not assigned.",
            "risk_class": "T3",
            "target_scope_refs": ["SCOPE-APPROVED-001"],
        })
        self.assertEqual(plan.status_code, 200)
        action = plan.json()

        rejected = self.client.post(
            f"/api/redteam/v2/tool-actions/{action['action_id']}/approve",
            headers=self.actor_headers("lead@example.com", "red_team_lead"),
            json={
                "case_id": "CASE-NO-RBAC-001",
                "approver": "lead@example.com",
                "approver_role": "red_team_lead",
                "decision": "approve",
            },
        )

        self.assertEqual(rejected.status_code, 200)
        body = rejected.json()
        self.assertEqual(body["status"], "invalid")
        self.assertIn("actor_not_assigned_to_case", body["errors"])
        self.assertIn("actor_context_not_authenticated", body["errors"])

    def test_v2_case_rbac_policy_crud_overrides_local_assignments(self) -> None:
        case_id = "CASE-CUSTOM-RBAC-001"
        created = self.client.put(f"/api/redteam/v2/cases/{case_id}/rbac", json={
            "updated_by": "control@example.com",
            "required_roles": ["red_team_lead", "executive_sponsor"],
            "assignments": [
                {"actor_id": "lead@example.com", "roles": ["red_team_lead"]},
                {"actor_id": "sponsor@example.com", "roles": ["executive_sponsor"]},
            ],
        })
        self.assertEqual(created.status_code, 200)
        created_body = created.json()
        self.assertEqual(created_body["status"], "active")
        self.assertEqual(created_body["policy_source"], "case_policy_artifact")
        self.assertTrue(Path(created_body["artifact_path"]).exists())

        policy = self.client.get(f"/api/redteam/v2/cases/{case_id}/rbac")
        self.assertEqual(policy.status_code, 200)
        policy_body = policy.json()
        self.assertEqual(policy_body["policy_source"], "case_policy_artifact")
        self.assertEqual(policy_body["assignment_count"], 2)
        lead = next(item for item in policy_body["assignments"] if item["actor_id"] == "lead@example.com")
        self.assertEqual(lead["roles"], ["red_team_lead"])

        added = self.client.post(f"/api/redteam/v2/cases/{case_id}/rbac/assignments", json={
            "updated_by": "control@example.com",
            "actor_id": "business-owner@example.com",
            "roles": ["business_owner"],
        })
        self.assertEqual(added.status_code, 200)
        self.assertEqual(added.json()["status"], "active")
        self.assertEqual(added.json()["assignment_count"], 3)

        deleted = self.client.request("DELETE", f"/api/redteam/v2/cases/{case_id}/rbac/assignments/business-owner@example.com", json={
            "updated_by": "control@example.com",
        })
        self.assertEqual(deleted.status_code, 200)
        self.assertEqual(deleted.json()["status"], "active")
        self.assertEqual(deleted.json()["assignment_count"], 2)

    def test_v2_case_rbac_policy_rejects_actor_role_mismatch(self) -> None:
        response = self.client.put("/api/redteam/v2/cases/CASE-CUSTOM-RBAC-INVALID-001/rbac", json={
            "assignments": [
                {"actor_id": "lead@example.com", "roles": ["executive_sponsor"]},
            ],
        })

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["status"], "invalid")
        self.assertIn("assignments[0].roles_not_authorized_for_actor:executive_sponsor", body["errors"])

    def test_v2_tool_action_approval_rejects_unregistered_actor_provider_context(self) -> None:
        plan = self.client.post("/api/redteam/v2/tool-actions/plan", json={
            "case_id": "CASE-V2-ACTOR-PROVIDER-001",
            "campaign_id": "CAMP-V2",
            "title": "Actor provider approval rejection",
            "objective": "Verify unregistered actors cannot satisfy HITL approval.",
            "risk_class": "T3",
            "target_scope_refs": ["SCOPE-APPROVED-001"],
        })
        self.assertEqual(plan.status_code, 200)
        action = plan.json()
        rejected = self.client.post(
            f"/api/redteam/v2/tool-actions/{action['action_id']}/approve",
            headers=self.actor_headers("unknown@example.com", "red_team_lead"),
            json={
                "case_id": "CASE-V2-ACTOR-PROVIDER-001",
                "approver": "unknown@example.com",
                "approver_role": "red_team_lead",
                "decision": "approve",
            },
        )
        self.assertEqual(rejected.status_code, 200)
        rejected_body = rejected.json()
        self.assertEqual(rejected_body["status"], "invalid")
        self.assertIn("actor_not_registered", rejected_body["errors"])
        self.assertIn("actor_context_not_authenticated", rejected_body["errors"])

    def test_v2_report_export_approval_accepts_session_bound_actor_context(self) -> None:
        case_id = "CASE-V2-ACTOR-SESSION-EXPORT-001"
        evidence = self.create_approved_evidence(case_id, "EV-ACTOR-SESSION-1")
        finding = self.create_approved_finding(case_id, "F-ACTOR-SESSION-1", evidence["evidence_id"])
        report = self.client.post("/api/redteam/v2/reports/generate", json={
            "title": "Actor Session Bound Korean Red Team Report v2",
            "case_id": case_id,
            "claims": [{"claim_id": "C-ACTOR-SESSION-1", "support_level": "supported", "evidence_ids": [evidence["evidence_id"]]}],
            "findings": [{"finding_id": finding["finding_id"], "severity_final": finding["severity_final"], "evidence_ids": [evidence["evidence_id"]]}],
            "tool_actions": [],
        })
        self.assertEqual(report.status_code, 200)
        report_body = report.json()
        self.assertEqual(report_body["gate_status"], "pass")

        approval = self.client.post(
            f"/api/redteam/v2/reports/{report_body['report_id']}/approve-export",
            headers=self.session_headers("sponsor@example.com"),
            json={
                "case_id": case_id,
                "approved_by": "sponsor@example.com",
                "approver_role": "executive_sponsor",
            },
        )
        self.assertEqual(approval.status_code, 200)
        approval_body = approval.json()
        self.assertEqual(approval_body["status"], "ExportApproved")
        self.assertEqual(approval_body["actor_context"]["auth_provider"], "local_dev_session")
        self.assertIn("report:approve_export", approval_body["actor_context"]["permissions"])

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

        approval = self.client.post(
            f"/api/redteam/v2/tool-actions/{action['action_id']}/approve",
            headers=self.actor_headers("control@example.com", "control_team"),
            json={
                "case_id": "CASE-V2-APPROVAL-001",
                "approver": "control@example.com",
                "approver_role": "control_team",
                "decision": "approve",
                "conditions": ["manual_run_only", "upload_artifacts_before_evidence"],
            },
        )
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

        approval = self.client.post(
            f"/api/redteam/v2/tool-actions/{action['action_id']}/approve",
            headers=self.actor_headers("analyst@example.com", "analyst"),
            json={
                "case_id": "CASE-V2-APPROVAL-ROLE-001",
                "approver": "analyst@example.com",
                "approver_role": "analyst",
                "decision": "approve",
            },
        )
        self.assertEqual(approval.status_code, 200)
        body = approval.json()
        self.assertEqual(body["status"], "invalid")
        self.assertIn("approver_role_not_authorized", body["errors"])
        self.assertEqual(body["action"]["status"], "ApprovalRequested")

    def test_v2_tool_action_approval_requires_actor_context_binding(self) -> None:
        plan = self.client.post("/api/redteam/v2/tool-actions/plan", json={
            "case_id": "CASE-V2-ACTOR-BINDING-001",
            "campaign_id": "CAMP-V2",
            "title": "Actor-bound T3 approval required",
            "objective": "Verify request body approver cannot bypass authenticated actor context",
            "risk_class": "T3",
            "target_scope_refs": ["SCOPE-APPROVED-001"],
        })
        action = plan.json()
        request = self.client.post(f"/api/redteam/v2/tool-actions/{action['action_id']}/request-approval", json={
            "case_id": "CASE-V2-ACTOR-BINDING-001",
            "requested_by": "analyst@example.com",
            "justification": "T3 requires red team lead approval.",
        })
        self.assertEqual(request.json()["status"], "ApprovalRequested")

        missing_actor = self.client.post(f"/api/redteam/v2/tool-actions/{action['action_id']}/approve", json={
            "case_id": "CASE-V2-ACTOR-BINDING-001",
            "approver": "lead@example.com",
            "approver_role": "red_team_lead",
            "decision": "approve",
        })
        self.assertEqual(missing_actor.json()["status"], "invalid")
        self.assertIn("actor_context_required", missing_actor.json()["errors"])

        mismatch = self.client.post(
            f"/api/redteam/v2/tool-actions/{action['action_id']}/approve",
            headers=self.actor_headers("other-lead@example.com", "red_team_lead"),
            json={
                "case_id": "CASE-V2-ACTOR-BINDING-001",
                "approver": "lead@example.com",
                "approver_role": "red_team_lead",
                "decision": "approve",
            },
        )
        self.assertEqual(mismatch.json()["status"], "invalid")
        self.assertIn("approver_must_match_authenticated_actor", mismatch.json()["errors"])

        approval = self.client.post(
            f"/api/redteam/v2/tool-actions/{action['action_id']}/approve",
            headers=self.actor_headers("lead@example.com", "red_team_lead"),
            json={
                "case_id": "CASE-V2-ACTOR-BINDING-001",
                "approver": "lead@example.com",
                "approver_role": "red_team_lead",
                "decision": "approve",
            },
        )
        self.assertEqual(approval.json()["status"], "Approved")
        self.assertEqual(approval.json()["identity_binding"], "bound")

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

        first = self.client.post(
            f"/api/redteam/v2/tool-actions/{action['action_id']}/approve",
            headers=self.actor_headers("control@example.com", "control_team"),
            json={
                "case_id": "CASE-V2-T5-TWO-PERSON-001",
                "approver": "control@example.com",
                "approver_role": "control_team",
                "decision": "approve",
            },
        )
        self.assertEqual(first.json()["status"], "PartiallyApproved")

        blocked_run = self.client.post(f"/api/redteam/v2/tool-actions/{action['action_id']}/manual-run-record", json={
            "case_id": "CASE-V2-T5-TWO-PERSON-001",
            "executed_by": "operator@example.com",
            "started_at": "2026-07-01T00:00:00Z",
            "ended_at": "2026-07-01T00:05:00Z",
            "uploaded_artifacts": ["artifact://t5-partial.txt"],
        })
        self.assertIn("approval_required_before_manual_run", blocked_run.json()["errors"])

        same_actor = self.client.post(
            f"/api/redteam/v2/tool-actions/{action['action_id']}/approve",
            headers=self.actor_headers("control@example.com", "second_approver"),
            json={
                "case_id": "CASE-V2-T5-TWO-PERSON-001",
                "approver": "control@example.com",
                "approver_role": "second_approver",
                "decision": "approve",
            },
        )
        self.assertEqual(same_actor.json()["status"], "invalid")
        self.assertIn("two_person_approval_requires_distinct_approvers", same_actor.json()["errors"])

        second = self.client.post(
            f"/api/redteam/v2/tool-actions/{action['action_id']}/approve",
            headers=self.actor_headers("second@example.com", "second_approver"),
            json={
                "case_id": "CASE-V2-T5-TWO-PERSON-001",
                "approver": "second@example.com",
                "approver_role": "second_approver",
                "decision": "approve",
            },
        )
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

    def test_v2_tool_run_import_normalize_and_create_evidence_candidate(self) -> None:
        case_id = "CASE-V2-TOOLRUN-001"
        plan = self.client.post("/api/redteam/v2/tool-actions/plan", json={
            "case_id": case_id,
            "campaign_id": "CAMP-V2",
            "title": "Normalize GoWitness-style screenshots",
            "objective": "Verify tool output becomes evidence candidate before report use",
            "risk_class": "T2",
            "target_scope_refs": ["SCOPE-APPROVED-001"],
            "tool_id": "TOOL-GOWITNESS-001",
            "action_type": "visual_recon",
        })
        action = plan.json()
        manual_run = self.client.post(f"/api/redteam/v2/tool-actions/{action['action_id']}/manual-run-record", json={
            "case_id": case_id,
            "executed_by": "analyst@example.com",
            "started_at": "2026-07-01T00:00:00Z",
            "ended_at": "2026-07-01T00:05:00Z",
            "uploaded_artifacts": ["artifact://gowitness/index.json", "artifact://gowitness/screen-001.png"],
        })
        run = manual_run.json()
        self.assertEqual(run["status"], "ManuallyExecuted")

        imported = self.client.post(f"/api/redteam/v2/tool-runs/{run['run_id']}/import-output", json={
            "case_id": case_id,
            "raw_artifacts": [
                {"source_path_or_ref": "artifact://gowitness/index.json", "content_type": "application/json", "summary": "GoWitness JSON index"},
                {"source_path_or_ref": "artifact://gowitness/screen-001.png", "content_type": "image/png", "summary": "Captured login page"},
            ],
        })
        self.assertEqual(imported.status_code, 200)
        imported_body = imported.json()
        self.assertEqual(imported_body["status"], "OutputImported")
        self.assertEqual(len(imported_body["raw_artifacts"]), 2)
        self.assertTrue(Path(imported_body["artifact_path"]).exists())

        normalized = self.client.post(f"/api/redteam/v2/tool-runs/{run['run_id']}/normalize", json={
            "case_id": case_id,
            "result_type": "visual_capture",
            "summary": "One screenshot was normalized as a visual evidence candidate.",
            "observations": ["The screenshot shows a login page."],
            "limitations": ["A login page screenshot does not prove compromise."],
            "structured_items": [{
                "item_type": "screenshot",
                "source_path_or_ref": "artifact://gowitness/screen-001.png",
                "confidence": 0.86,
            }],
        })
        self.assertEqual(normalized.status_code, 200)
        normalized_body = normalized.json()
        self.assertEqual(normalized_body["status"], "Normalized")
        self.assertIn("Do not claim compromise from tool output alone.", normalized_body["prohibited_report_claims"])
        self.assertTrue(Path(normalized_body["artifact_path"]).exists())

        evidence = self.client.post(f"/api/redteam/v2/tool-runs/{run['run_id']}/create-evidence", json={
            "case_id": case_id,
            "result_id": normalized_body["result_id"],
            "summary": "GoWitness screenshot evidence candidate for analyst review.",
        })
        self.assertEqual(evidence.status_code, 200)
        evidence_body = evidence.json()
        self.assertEqual(evidence_body["kind"], "redteam_ax_v2_evidence_candidate")
        self.assertEqual(evidence_body["validation_status"], "candidate")
        self.assertIn("prohibited_report_claims", evidence_body["normalized_fields"])
        self.assertTrue(Path(evidence_body["artifact_path"]).exists())

        reloaded_action = self.client.get(f"/api/redteam/v2/tool-actions/{action['action_id']}", params={"case_id": case_id})
        self.assertEqual(reloaded_action.json()["status"], "EvidenceCreated")

    def test_v2_tool_run_normalize_requires_imported_output(self) -> None:
        response = self.client.post("/api/redteam/v2/tool-runs/TMR-MISSING/normalize", json={
            "case_id": "CASE-V2-MISSING-TOOLRUN-001",
            "structured_items": [{"item_type": "artifact_observation"}],
        })

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["status"], "invalid")
        self.assertIn("tool_run_record_required", body["errors"])

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
        case_id = "CASE-V2-REPORT-GENERATE-001"
        evidence = self.create_approved_evidence(case_id, "EV-1")
        finding = self.create_approved_finding(case_id, "F-1", evidence["evidence_id"])
        response = self.client.post("/api/redteam/v2/reports/generate", json={
            "title": "Korean Red Team Report v2",
            "case_id": case_id,
            "claims": [{"claim_id": "C-1", "support_level": "supported", "evidence_ids": [evidence["evidence_id"]]}],
            "findings": [{"finding_id": finding["finding_id"], "severity_final": finding["severity_final"], "evidence_ids": [evidence["evidence_id"]]}],
            "tool_actions": [{"action_id": "TAC-1", "risk_class": "T3", "approval_required": True, "status": "EvidenceCreated"}],
        })

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["gate_status"], "pass")
        self.assertIsNotNone(body["report"])
        self.assertIn("Claim-Evidence Matrix", body["report"]["sections"])

    def test_v2_report_gate_blocks_missing_unapproved_and_unverified_evidence(self) -> None:
        case_id = "CASE-V2-REPORT-EVIDENCE-GATE-001"
        unapproved = self.client.post("/api/redteam/v2/evidence", json={
            "case_id": case_id,
            "evidence_id": "EV-PENDING-1",
            "source_path_or_url": "artifact://pending.json",
            "summary": "Pending evidence must not be used in report export.",
        })
        self.assertEqual(unapproved.status_code, 200)

        response = self.client.post("/api/redteam/v2/reports/validate", json={
            "case_id": case_id,
            "claims": [{"claim_id": "C-EV-1", "support_level": "supported", "evidence_ids": ["EV-PENDING-1", "EV-MISSING-1"]}],
            "findings": [{"finding_id": "F-EV-1", "evidence_ids": ["EV-PENDING-1"]}],
            "tool_actions": [],
        })

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["gate_status"], "blocked")
        self.assertEqual(body["missing_evidence_count"], 1)
        self.assertEqual(body["unapproved_evidence_count"], 1)
        self.assertEqual(body["unverified_evidence_count"], 1)
        self.assertIn("missing_evidence", {item["type"] for item in body["blocking_items"]})
        self.assertIn("unapproved_evidence", {item["type"] for item in body["blocking_items"]})

    def test_v2_report_gate_blocks_unapproved_finding_and_final_severity(self) -> None:
        case_id = "CASE-V2-FINDING-GATE-001"
        evidence = self.create_approved_evidence(case_id, "EV-FINDING-1")
        finding = self.client.post("/api/redteam/v2/findings", json={
            "case_id": case_id,
            "finding_id": "F-PENDING-1",
            "title": "Pending finding must not enter report",
            "severity_draft": "high",
            "evidence_ids": [evidence["evidence_id"]],
            "root_cause": ["missing_review"],
            "business_impact": "Pending business impact.",
            "owner": "Security Engineering",
            "sla": "30 days",
            "retest_criteria": "Retest after approval.",
            "affected_business_process": ["Report Studio validation"],
        })
        self.assertEqual(finding.status_code, 200)

        response = self.client.post("/api/redteam/v2/reports/validate", json={
            "case_id": case_id,
            "claims": [{"claim_id": "C-FINDING-1", "support_level": "supported", "evidence_ids": [evidence["evidence_id"]]}],
            "findings": [{"finding_id": "F-PENDING-1", "severity_final": "high", "evidence_ids": [evidence["evidence_id"]]}],
            "tool_actions": [],
        })

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["gate_status"], "blocked")
        self.assertEqual(body["unapproved_finding_count"], 1)
        self.assertEqual(body["unapproved_final_severity_count"], 1)
        self.assertIn("unapproved_finding", {item["type"] for item in body["blocking_items"]})

    def test_v2_report_export_requires_final_human_approval(self) -> None:
        case_id = "CASE-V2-REPORT-EXPORT-001"
        evidence = self.create_approved_evidence(case_id, "EV-EXP-1")
        finding = self.create_approved_finding(case_id, "F-EXP-1", evidence["evidence_id"])
        report = self.client.post("/api/redteam/v2/reports/generate", json={
            "title": "Korean Red Team Report v2 Export",
            "case_id": case_id,
            "claims": [{"claim_id": "C-EXP-1", "support_level": "supported", "evidence_ids": [evidence["evidence_id"]]}],
            "findings": [{"finding_id": finding["finding_id"], "severity_final": finding["severity_final"], "evidence_ids": [evidence["evidence_id"]]}],
            "tool_actions": [{"action_id": "TAC-EXP-1", "risk_class": "T3", "approval_required": True, "status": "EvidenceCreated"}],
        })
        self.assertEqual(report.status_code, 200)
        report_body = report.json()
        self.assertEqual(report_body["gate_status"], "pass")

        unapproved_export = self.client.post(f"/api/redteam/v2/reports/{report_body['report_id']}/export", json={
            "case_id": case_id,
        })
        self.assertEqual(unapproved_export.status_code, 200)
        self.assertEqual(unapproved_export.json()["status"], "blocked")
        self.assertIn("report_export_approval_required", unapproved_export.json()["errors"])

        missing_actor = self.client.post(f"/api/redteam/v2/reports/{report_body['report_id']}/approve-export", json={
            "case_id": case_id,
            "approved_by": "sponsor@example.com",
            "approver_role": "executive_sponsor",
        })
        self.assertEqual(missing_actor.status_code, 200)
        self.assertEqual(missing_actor.json()["status"], "invalid")
        self.assertIn("actor_context_required", missing_actor.json()["errors"])

        bad_approval = self.client.post(
            f"/api/redteam/v2/reports/{report_body['report_id']}/approve-export",
            headers=self.actor_headers("lead@example.com", "red_team_lead"),
            json={
                "case_id": case_id,
                "approved_by": "lead@example.com",
                "approver_role": "red_team_lead",
            },
        )
        self.assertEqual(bad_approval.status_code, 200)
        self.assertEqual(bad_approval.json()["status"], "invalid")
        self.assertIn("executive_sponsor_approval_required", bad_approval.json()["errors"])

        mismatch = self.client.post(
            f"/api/redteam/v2/reports/{report_body['report_id']}/approve-export",
            headers=self.actor_headers("other-sponsor@example.com", "executive_sponsor"),
            json={
                "case_id": case_id,
                "approved_by": "sponsor@example.com",
                "approver_role": "executive_sponsor",
            },
        )
        self.assertEqual(mismatch.status_code, 200)
        self.assertEqual(mismatch.json()["status"], "invalid")
        self.assertIn("approver_must_match_authenticated_actor", mismatch.json()["errors"])

        approval = self.client.post(
            f"/api/redteam/v2/reports/{report_body['report_id']}/approve-export",
            headers=self.actor_headers("sponsor@example.com", "executive_sponsor"),
            json={
                "case_id": case_id,
                "approved_by": "sponsor@example.com",
                "approver_role": "executive_sponsor",
            },
        )
        self.assertEqual(approval.status_code, 200)
        approval_body = approval.json()
        self.assertEqual(approval_body["status"], "ExportApproved")
        self.assertEqual(approval_body["identity_binding"], "bound")
        self.assertEqual(approval_body["actor_context"]["actor_id"], "sponsor@example.com")
        self.assertEqual(approval_body["gate_snapshot"]["unsupported_claim_count"], 0)
        self.assertTrue(Path(approval_body["artifact_path"]).exists())

        exported = self.client.post(f"/api/redteam/v2/reports/{report_body['report_id']}/export", json={
            "case_id": case_id,
            "approval_id": approval_body["approval_id"],
        })
        self.assertEqual(exported.status_code, 200)
        exported_body = exported.json()
        self.assertEqual(exported_body["status"], "Exported")
        self.assertEqual(exported_body["gate_snapshot"]["unapproved_high_risk_count"], 0)
        self.assertTrue(Path(exported_body["artifact_path"]).exists())

    def test_v2_report_export_approval_blocks_failed_report_gate(self) -> None:
        case_id = "CASE-V2-REPORT-EXPORT-BLOCKED-001"
        report = self.client.post("/api/redteam/v2/reports/generate", json={
            "title": "Blocked Korean Red Team Report v2",
            "case_id": case_id,
            "claims": [{"claim_id": "C-BLK-1", "support_level": "unsupported", "evidence_ids": []}],
            "findings": [{"finding_id": "F-BLK-1", "evidence_ids": []}],
            "tool_actions": [{"action_id": "TAC-BLK-1", "risk_class": "T4", "approval_required": True, "status": "ScopeValidated"}],
        })
        self.assertEqual(report.status_code, 200)
        report_body = report.json()
        self.assertEqual(report_body["gate_status"], "blocked")

        approval = self.client.post(
            f"/api/redteam/v2/reports/{report_body['report_id']}/approve-export",
            headers=self.actor_headers("sponsor@example.com", "executive_sponsor"),
            json={
                "case_id": case_id,
                "approved_by": "sponsor@example.com",
                "approver_role": "executive_sponsor",
            },
        )
        self.assertEqual(approval.status_code, 200)
        approval_body = approval.json()
        self.assertEqual(approval_body["status"], "invalid")
        self.assertIn("report_validation_gate_not_passed", approval_body["errors"])
        self.assertIn("unsupported_claims_present", approval_body["errors"])


if __name__ == "__main__":
    unittest.main()
