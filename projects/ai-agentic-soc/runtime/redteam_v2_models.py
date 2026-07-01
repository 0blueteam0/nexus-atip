from __future__ import annotations

import hashlib
from datetime import datetime, timezone
from typing import Any


RISK_CLASSES = {"T0", "T1", "T2", "T3", "T4", "T5"}
HIGH_RISK_CLASSES = {"T3", "T4", "T5"}
TERMINAL_APPROVED_STATUSES = {"Approved", "ReadyForManualRun", "ManuallyExecuted", "OutputImported", "Normalized", "EvidenceCreated", "LinkedToFinding", "Closed"}


def now_utc() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def stable_id(prefix: str, parts: list[Any]) -> str:
    raw = "|".join(str(part) for part in parts)
    digest = hashlib.sha256(raw.encode("utf-8")).hexdigest()[:12].upper()
    return f"{prefix}-{digest}"


def normalize_risk_class(value: Any) -> str:
    risk_class = str(value or "T2").strip().upper()
    return risk_class if risk_class in RISK_CLASSES else "T5"


def evaluate_roe(payload: dict[str, Any]) -> dict[str, Any]:
    case_id = str(payload.get("case_id") or "").strip()
    target_scope_refs = payload.get("target_scope_refs") or []
    prohibited_actions = payload.get("prohibited_actions") or []
    risk_class = normalize_risk_class(payload.get("risk_class"))
    failures: list[str] = []

    if not case_id:
        failures.append("case_id_required")
    if not isinstance(target_scope_refs, list) or not target_scope_refs:
        failures.append("target_scope_refs_required")
    if any(str(item).strip().lower() in {"credential_collection", "destructive_actions"} for item in prohibited_actions):
        failures.append("prohibited_action_requested")
    if risk_class == "T5" and payload.get("control_team_override") is not True:
        failures.append("t5_requires_control_team_override")

    decision = "allow" if not failures else "deny"
    return {
        "kind": "redteam_ax_v2_roe_evaluation",
        "case_id": case_id,
        "decision": decision,
        "risk_class": risk_class,
        "hitl_required": risk_class in HIGH_RISK_CLASSES,
        "failures": failures,
        "evaluated_at": now_utc(),
    }


def plan_tool_action(payload: dict[str, Any]) -> dict[str, Any]:
    risk_class = normalize_risk_class(payload.get("risk_class"))
    case_id = str(payload.get("case_id") or "CASE-UNSPECIFIED").strip()
    objective = str(payload.get("objective") or "RedTeam AX v2 approved-scope action").strip()
    title = str(payload.get("title") or objective).strip()
    target_scope_refs = payload.get("target_scope_refs") or []
    prohibited_actions = payload.get("prohibited_actions") or ["credential_collection", "destructive_actions"]
    roe = evaluate_roe({
        "case_id": case_id,
        "target_scope_refs": target_scope_refs,
        "risk_class": risk_class,
        "prohibited_actions": [],
        "control_team_override": payload.get("control_team_override"),
    })
    approval_required = risk_class in HIGH_RISK_CLASSES
    status = "ScopeValidated" if roe["decision"] == "allow" else "NeedsRevision"
    allowed_buttons = ["Plan", "Select Tool", "Validate Scope", "Record Manual Run", "Import Output", "Create Evidence", "Generate Finding Draft"]
    if not approval_required:
        allowed_buttons.insert(4, "Dry Run")
    else:
        allowed_buttons.insert(4, "Request Approval")

    action_id = str(payload.get("action_id") or stable_id("TAC", [case_id, title, objective, risk_class]))
    return {
        "kind": "redteam_ax_v2_tool_action_card",
        "action_id": action_id,
        "case_id": case_id,
        "campaign_id": payload.get("campaign_id") or "CAMP-V2-DEFAULT",
        "title": title,
        "objective": objective,
        "action_type": payload.get("action_type") or "analysis_support",
        "tool_id": payload.get("tool_id") or "TOOL-MANUAL-RECORDER",
        "risk_class": risk_class,
        "environment": payload.get("environment") or "approved_scope",
        "target_scope_refs": target_scope_refs,
        "inputs": payload.get("inputs") or {},
        "expected_outputs": payload.get("expected_outputs") or ["manual_run_record", "normalized_result", "evidence_candidate"],
        "policy_requirements": ["scope_validation", "artifact_hashing", "audit_logging", "claim_evidence_linking"],
        "approval_required": approval_required,
        "hitl_required": approval_required,
        "allowed_buttons": allowed_buttons,
        "prohibited_actions": prohibited_actions,
        "status": status,
        "roe_evaluation": roe,
        "audit_events": [{"event": "planned", "at": now_utc(), "actor": payload.get("requested_by") or "analyst"}],
    }


def record_manual_run(action_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    executed_by = str(payload.get("executed_by") or "").strip()
    uploaded_artifacts = payload.get("uploaded_artifacts") or []
    errors: list[str] = []
    if not executed_by:
        errors.append("executed_by_required")
    if not isinstance(uploaded_artifacts, list) or not uploaded_artifacts:
        errors.append("uploaded_artifacts_required")

    run_id = stable_id("TMR", [action_id, executed_by, payload.get("started_at"), payload.get("ended_at"), uploaded_artifacts])
    evidence_candidates = [
        {
            "evidence_id": stable_id("EV", [run_id, artifact]),
            "source_type": "manual_run_artifact",
            "source_path_or_ref": artifact,
            "validation_status": "candidate",
            "summary": payload.get("notes") or "Manual run artifact imported for analyst review",
        }
        for artifact in uploaded_artifacts
    ]
    return {
        "kind": "redteam_ax_v2_manual_run_record",
        "run_id": run_id,
        "action_id": action_id,
        "status": "invalid" if errors else "ManuallyExecuted",
        "errors": errors,
        "executed_by": executed_by,
        "started_at": payload.get("started_at"),
        "ended_at": payload.get("ended_at"),
        "notes": payload.get("notes") or "",
        "uploaded_artifacts": uploaded_artifacts,
        "normalized_result": {
            "status": "pending_review" if not errors else "blocked",
            "evidence_candidate_count": len(evidence_candidates),
        },
        "evidence_candidates": evidence_candidates,
        "audit_events": [{"event": "manual_run_recorded", "at": now_utc(), "actor": executed_by or "unknown"}],
    }


def create_evidence_card(payload: dict[str, Any]) -> dict[str, Any]:
    case_id = str(payload.get("case_id") or "").strip()
    source = str(payload.get("source_path_or_url") or payload.get("source_path_or_ref") or "").strip()
    summary = str(payload.get("summary") or "").strip()
    errors: list[str] = []
    if not case_id:
        errors.append("case_id_required")
    if not source:
        errors.append("source_path_or_url_required")
    if not summary:
        errors.append("summary_required")
    evidence_id = str(payload.get("evidence_id") or stable_id("EV", [case_id, source, summary]))
    return {
        "kind": "redteam_ax_v2_evidence_card",
        "evidence_id": evidence_id,
        "case_id": case_id,
        "source_type": payload.get("source_type") or "artifact",
        "source_path_or_url": source,
        "collected_at": payload.get("collected_at") or now_utc(),
        "hash": payload.get("hash") or stable_id("SHA256", [source, summary]),
        "summary": summary,
        "normalized_fields": payload.get("normalized_fields") or {},
        "validation_status": "candidate" if errors else payload.get("validation_status", "approved"),
        "errors": errors,
    }


def validate_report(payload: dict[str, Any]) -> dict[str, Any]:
    claims = payload.get("claims") or []
    findings = payload.get("findings") or []
    tool_actions = payload.get("tool_actions") or []
    unsupported_claims = [
        claim for claim in claims
        if not claim.get("evidence_ids") or str(claim.get("support_level") or "supported").lower() in {"unsupported", "none"}
    ]
    findings_without_evidence = [
        finding for finding in findings
        if not finding.get("evidence_ids")
    ]
    unapproved_high_risk = [
        action for action in tool_actions
        if normalize_risk_class(action.get("risk_class")) in HIGH_RISK_CLASSES
        and action.get("approval_required") is not False
        and str(action.get("status") or "") not in TERMINAL_APPROVED_STATUSES
    ]
    blocking_items = []
    blocking_items.extend({"type": "unsupported_claim", "id": item.get("claim_id") or item.get("id")} for item in unsupported_claims)
    blocking_items.extend({"type": "finding_without_evidence", "id": item.get("finding_id") or item.get("id")} for item in findings_without_evidence)
    blocking_items.extend({"type": "unapproved_high_risk_action", "id": item.get("action_id") or item.get("id")} for item in unapproved_high_risk)
    gate_status = "pass" if not blocking_items else "blocked"
    return {
        "kind": "redteam_ax_v2_report_validation",
        "gate_status": gate_status,
        "unsupported_claim_count": len(unsupported_claims),
        "unapproved_high_risk_count": len(unapproved_high_risk),
        "finding_without_evidence_count": len(findings_without_evidence),
        "blocking_items": blocking_items,
        "validated_at": now_utc(),
    }


def generate_report(payload: dict[str, Any]) -> dict[str, Any]:
    validation = validate_report(payload)
    return {
        "kind": "redteam_ax_v2_korean_report_draft",
        "gate_status": validation["gate_status"],
        "validation": validation,
        "report": None if validation["gate_status"] != "pass" else {
            "title": payload.get("title") or "Red Team Report v2",
            "language": "ko",
            "sections": [
                "문서 통제",
                "캠페인 Walkthrough",
                "Evidence Card Index",
                "Claim-Evidence Matrix",
                "Findings",
                "재시험 계획",
            ],
        },
    }
