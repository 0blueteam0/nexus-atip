from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Header

try:
    from runtime import redteam_v2_models
except ModuleNotFoundError:
    import redteam_v2_models  # type: ignore


router = APIRouter(prefix="/api/redteam/v2", tags=["redteam-v2"])


def with_actor_context(
    payload: dict[str, Any],
    actor_id: str | None,
    actor_role: str | None,
    session_token: str | None = None,
) -> dict[str, Any]:
    actor_context = redteam_v2_models.resolve_actor_context(
        payload,
        actor_id=actor_id,
        actor_role=actor_role,
        session_token=session_token,
    )
    return {
        **payload,
        "_actor_context": {
            **actor_context,
            "resolved": True,
        },
    }


@router.get("/health")
def redteam_v2_health() -> dict[str, Any]:
    return {
        "kind": "redteam_ax_v2_health",
        "service": "redteam-ax-v2",
        "status": "ready",
        "safe_by_default": True,
        "execution_policy": "tool_action_card_required",
        "high_risk_mode": "human_approved_manual_run",
        "report_gate": {
            "unsupported_claim_count": 0,
            "unapproved_high_risk_count": 0,
            "finding_without_evidence_count": 0,
            "unapproved_finding_count": 0,
            "unapproved_final_severity_count": 0,
        },
        "actor_context_provider": "local_dev_session_or_request_headers",
    }


@router.post("/auth/actor-context")
def resolve_actor_context(
    payload: dict[str, Any],
    x_redteam_actor: str | None = Header(default=None),
    x_redteam_actor_role: str | None = Header(default=None),
    x_redteam_session: str | None = Header(default=None),
) -> dict[str, Any]:
    context = redteam_v2_models.resolve_actor_context(
        payload,
        actor_id=x_redteam_actor,
        actor_role=x_redteam_actor_role,
        session_token=x_redteam_session,
    )
    return {
        "kind": "redteam_ax_v2_actor_context",
        "actor_context": context,
        "status": "authenticated" if context.get("authenticated") else "invalid",
        "errors": context.get("errors") or [],
    }


@router.get("/cases/{case_id}/rbac")
def get_case_rbac_policy(case_id: str) -> dict[str, Any]:
    return redteam_v2_models.case_rbac_policy(case_id)


@router.put("/cases/{case_id}/rbac")
def upsert_case_rbac_policy(case_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.upsert_case_rbac_policy(case_id, payload)


@router.post("/cases/{case_id}/rbac/assignments")
def add_case_rbac_assignment(case_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.add_case_rbac_assignment(case_id, payload)


@router.delete("/cases/{case_id}/rbac/assignments/{actor_id}")
def delete_case_rbac_assignment(case_id: str, actor_id: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
    return redteam_v2_models.delete_case_rbac_assignment(case_id, actor_id, payload)


@router.post("/roe/evaluate")
def evaluate_roe(payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.evaluate_roe(payload)


@router.post("/tool-actions/plan")
def plan_tool_action(payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.plan_tool_action(payload)


@router.get("/analysis-tools")
def list_analysis_tools() -> dict[str, Any]:
    return redteam_v2_models.list_analysis_tools()


@router.get("/analysis-agents")
def list_analysis_agents() -> dict[str, Any]:
    return redteam_v2_models.list_analysis_agents()


@router.get("/tool-actions")
def list_tool_actions(case_id: str | None = None, status: str | None = None) -> dict[str, Any]:
    return redteam_v2_models.list_tool_actions(case_id=case_id, status=status)


@router.get("/tool-actions/{action_id}")
def get_tool_action(action_id: str, case_id: str | None = None) -> dict[str, Any]:
    action = redteam_v2_models.load_tool_action(action_id, case_id=case_id)
    if action is None:
        return {
            "kind": "redteam_ax_v2_tool_action_card",
            "action_id": action_id,
            "status": "not_found",
            "errors": ["tool_action_not_found"],
        }
    return action


@router.post("/tool-actions/{action_id}/request-approval")
def request_tool_action_approval(action_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.request_tool_action_approval(action_id, payload)


@router.post("/tool-actions/{action_id}/approve")
def approve_tool_action(
    action_id: str,
    payload: dict[str, Any],
    x_redteam_actor: str | None = Header(default=None),
    x_redteam_actor_role: str | None = Header(default=None),
    x_redteam_session: str | None = Header(default=None),
) -> dict[str, Any]:
    return redteam_v2_models.approve_tool_action(action_id, with_actor_context(payload, x_redteam_actor, x_redteam_actor_role, x_redteam_session))


@router.post("/tool-actions/{action_id}/manual-run-record")
def record_manual_run(action_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.record_manual_run(action_id, payload)


@router.post("/tool-actions/{action_id}/execute-governed")
def governed_tool_execution(action_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.governed_tool_execution(action_id, payload)


@router.post("/tool-runs/{run_id}/import-output")
def import_tool_run_output(run_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.import_tool_run_output(run_id, payload)


@router.post("/tool-runs/{run_id}/import-file")
def import_tool_run_file(run_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.import_tool_run_file(run_id, payload)


@router.post("/tool-runs/{run_id}/agent-analyze")
def agent_analyze_tool_run(run_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.agent_analyze_tool_run(run_id, payload)


@router.post("/tool-runs/{run_id}/normalize")
def normalize_tool_run(run_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.normalize_tool_run(run_id, payload)


@router.post("/tool-runs/{run_id}/create-evidence")
def create_evidence_from_tool_run(run_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.create_evidence_from_tool_run(run_id, payload)


@router.post("/evidence")
def create_evidence(payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.create_evidence_card(payload)


@router.post("/evidence/{evidence_id}/approve")
def approve_evidence(
    evidence_id: str,
    payload: dict[str, Any],
    x_redteam_actor: str | None = Header(default=None),
    x_redteam_actor_role: str | None = Header(default=None),
    x_redteam_session: str | None = Header(default=None),
) -> dict[str, Any]:
    return redteam_v2_models.approve_evidence_card(evidence_id, with_actor_context(payload, x_redteam_actor, x_redteam_actor_role, x_redteam_session))


@router.post("/findings")
def create_finding(payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.create_finding(payload)


@router.post("/findings/{finding_id}/approve-severity")
def approve_finding_severity(
    finding_id: str,
    payload: dict[str, Any],
    x_redteam_actor: str | None = Header(default=None),
    x_redteam_actor_role: str | None = Header(default=None),
    x_redteam_session: str | None = Header(default=None),
) -> dict[str, Any]:
    return redteam_v2_models.approve_finding_severity(finding_id, with_actor_context(payload, x_redteam_actor, x_redteam_actor_role, x_redteam_session))


@router.post("/reports/validate")
def validate_report(payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.validate_report(payload)


@router.post("/reports/generate")
def generate_report(payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.generate_report(payload)


@router.post("/reports/{report_id}/approve-export")
def approve_report_export(
    report_id: str,
    payload: dict[str, Any],
    x_redteam_actor: str | None = Header(default=None),
    x_redteam_actor_role: str | None = Header(default=None),
    x_redteam_session: str | None = Header(default=None),
) -> dict[str, Any]:
    return redteam_v2_models.approve_report_export(report_id, with_actor_context(payload, x_redteam_actor, x_redteam_actor_role, x_redteam_session))


@router.post("/reports/{report_id}/export")
def export_report(report_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.export_report(report_id, payload)
