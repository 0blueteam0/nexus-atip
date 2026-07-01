from __future__ import annotations

from typing import Any

from fastapi import APIRouter

try:
    from runtime import redteam_v2_models
except ModuleNotFoundError:
    import redteam_v2_models  # type: ignore


router = APIRouter(prefix="/api/redteam/v2", tags=["redteam-v2"])


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
        },
    }


@router.post("/roe/evaluate")
def evaluate_roe(payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.evaluate_roe(payload)


@router.post("/tool-actions/plan")
def plan_tool_action(payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.plan_tool_action(payload)


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
def approve_tool_action(action_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.approve_tool_action(action_id, payload)


@router.post("/tool-actions/{action_id}/manual-run-record")
def record_manual_run(action_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.record_manual_run(action_id, payload)


@router.post("/tool-runs/{run_id}/import-output")
def import_tool_run_output(run_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.import_tool_run_output(run_id, payload)


@router.post("/tool-runs/{run_id}/normalize")
def normalize_tool_run(run_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.normalize_tool_run(run_id, payload)


@router.post("/tool-runs/{run_id}/create-evidence")
def create_evidence_from_tool_run(run_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.create_evidence_from_tool_run(run_id, payload)


@router.post("/evidence")
def create_evidence(payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.create_evidence_card(payload)


@router.post("/reports/validate")
def validate_report(payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.validate_report(payload)


@router.post("/reports/generate")
def generate_report(payload: dict[str, Any]) -> dict[str, Any]:
    return redteam_v2_models.generate_report(payload)
