from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_V2_ROOT = PROJECT_ROOT / "archive" / "runs" / "redteam-ax-v2"
RISK_CLASSES = {"T0", "T1", "T2", "T3", "T4", "T5"}
HIGH_RISK_CLASSES = {"T3", "T4", "T5"}
TERMINAL_APPROVED_STATUSES = {"Approved", "ReadyForManualRun", "ManuallyExecuted", "OutputImported", "Normalized", "EvidenceCreated", "LinkedToFinding", "Closed"}
APPROVER_ROLES = {
    "analyst",
    "red_team_lead",
    "control_team",
    "second_approver",
    "legal_privacy",
    "data_owner",
    "executive_sponsor",
}
REPORT_EXPORT_APPROVER_ROLES = {"executive_sponsor"}


def now_utc() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def stable_id(prefix: str, parts: list[Any]) -> str:
    raw = "|".join(str(part) for part in parts)
    digest = hashlib.sha256(raw.encode("utf-8")).hexdigest()[:12].upper()
    return f"{prefix}-{digest}"


def safe_name(value: Any) -> str:
    raw = str(value or "unknown").strip()
    safe = "".join(ch if ch.isalnum() or ch in {"-", "_", "."} else "_" for ch in raw)
    return safe[:120] or "unknown"


def case_dir(case_id: str) -> Path:
    path = DEFAULT_V2_ROOT / safe_name(case_id)
    path.mkdir(parents=True, exist_ok=True)
    return path


def write_json_artifact(case_id: str, category: str, record_id: str, payload: dict[str, Any]) -> str:
    path = case_dir(case_id) / safe_name(category)
    path.mkdir(parents=True, exist_ok=True)
    artifact_path = path / f"{safe_name(record_id)}.json"
    payload["artifact_path"] = artifact_path.as_posix()
    artifact_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return artifact_path.as_posix()


def write_case_event(case_id: str, event: dict[str, Any]) -> str:
    path = case_dir(case_id) / "audit.jsonl"
    record = {"recorded_at": now_utc(), **event}
    with path.open("a", encoding="utf-8", newline="\n") as handle:
        handle.write(json.dumps(record, ensure_ascii=False, sort_keys=True) + "\n")
    return path.as_posix()


def append_artifact_metadata(payload: dict[str, Any], category: str, record_id: str) -> dict[str, Any]:
    case_id = str(payload.get("case_id") or "CASE-UNSPECIFIED")
    payload["artifact_path"] = write_json_artifact(case_id, category, record_id, payload)
    payload["audit_log_path"] = write_case_event(case_id, {
        "event": f"{category}_stored",
        "record_id": record_id,
        "artifact_path": payload["artifact_path"],
    })
    return payload


def read_json_artifact(path: Path) -> dict[str, Any] | None:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None


def list_json_artifacts(case_id: str | None, category: str) -> list[dict[str, Any]]:
    roots = [case_dir(case_id)] if case_id else [path for path in DEFAULT_V2_ROOT.glob("*") if path.is_dir()]
    records: list[tuple[float, dict[str, Any]]] = []
    for root in roots:
        category_dir = root / safe_name(category)
        if not category_dir.exists():
            continue
        for artifact_path in category_dir.glob("*.json"):
            record = read_json_artifact(artifact_path)
            if record is not None:
                records.append((artifact_path.stat().st_mtime, record))
    return [record for _, record in sorted(records, key=lambda item: item[0], reverse=True)]


def load_json_record(record_id: str, category: str, case_id: str | None = None) -> dict[str, Any] | None:
    safe_record_id = safe_name(record_id)
    roots = [case_dir(case_id)] if case_id else [path for path in DEFAULT_V2_ROOT.glob("*") if path.is_dir()]
    safe_category = safe_name(category)
    for root in roots:
        artifact_path = root / safe_category / f"{safe_record_id}.json"
        if artifact_path.exists():
            return read_json_artifact(artifact_path)
    for record in list_json_artifacts(case_id, category):
        known_id = (
            record.get("run_id")
            or record.get("result_id")
            or record.get("evidence_id")
            or record.get("report_id")
            or record.get("approval_id")
            or record.get("export_id")
            or record.get("id")
            or ""
        )
        if str(known_id) == record_id:
            return record
    return None


def list_tool_actions(case_id: str | None = None, status: str | None = None) -> dict[str, Any]:
    actions = list_json_artifacts(case_id, "tool-actions")
    if status:
        actions = [action for action in actions if str(action.get("status") or "") == status]
    return {
        "kind": "redteam_ax_v2_tool_action_list",
        "case_id": case_id,
        "status": status,
        "count": len(actions),
        "items": actions,
    }


def load_tool_action(action_id: str, case_id: str | None = None) -> dict[str, Any] | None:
    safe_action_id = safe_name(action_id)
    roots = [case_dir(case_id)] if case_id else [path for path in DEFAULT_V2_ROOT.glob("*") if path.is_dir()]
    for root in roots:
        artifact_path = root / "tool-actions" / f"{safe_action_id}.json"
        if artifact_path.exists():
            return read_json_artifact(artifact_path)
    for action in list_json_artifacts(case_id, "tool-actions"):
        if str(action.get("action_id") or "") == action_id:
            return action
    return None


def persist_tool_action(action: dict[str, Any], event: dict[str, Any]) -> dict[str, Any]:
    case_id = str(action.get("case_id") or "CASE-UNSPECIFIED")
    action_id = str(action.get("action_id") or stable_id("TAC", [case_id, action]))
    action["artifact_path"] = write_json_artifact(case_id, "tool-actions", action_id, action)
    action["audit_log_path"] = write_case_event(case_id, {
        "event": event.get("event") or "tool_action_updated",
        "record_id": action_id,
        "artifact_path": action["artifact_path"],
        **{k: v for k, v in event.items() if k != "event"},
    })
    return action


def normalize_risk_class(value: Any) -> str:
    risk_class = str(value or "T2").strip().upper()
    return risk_class if risk_class in RISK_CLASSES else "T5"


def normalize_approver_role(value: Any) -> str:
    role = str(value or "").strip().lower().replace("-", "_").replace(" ", "_")
    return role if role in APPROVER_ROLES else ""


def approval_policy_for(action: dict[str, Any]) -> dict[str, Any]:
    risk_class = normalize_risk_class(action.get("risk_class"))
    environment = str(action.get("environment") or "").strip().lower()
    action_type = str(action.get("action_type") or "").strip().lower()
    required_roles: list[str] = []
    approval_mode = "none"

    if risk_class == "T3":
        required_roles = ["red_team_lead"]
        approval_mode = "single_lead"
    elif risk_class == "T4":
        required_roles = ["control_team"]
        approval_mode = "control_team"
    elif risk_class == "T5" or environment == "controlled_production_execute" or action_type == "controlled_production_execute":
        required_roles = ["control_team", "second_approver"]
        approval_mode = "two_person"

    return {
        "approval_mode": approval_mode,
        "required_approver_roles": required_roles,
        "requires_distinct_approvers": approval_mode == "two_person",
    }


def approved_roles_for(action: dict[str, Any]) -> set[str]:
    decisions = action.get("approval_decisions") or []
    return {
        normalize_approver_role(decision.get("approver_role"))
        for decision in decisions
        if str(decision.get("decision") or "").lower() == "approve"
    } - {""}


def approved_actors_for(action: dict[str, Any]) -> set[str]:
    decisions = action.get("approval_decisions") or []
    return {
        str(decision.get("approver") or "").strip().lower()
        for decision in decisions
        if str(decision.get("decision") or "").lower() == "approve"
    } - {""}


def approval_status_for(action: dict[str, Any]) -> str:
    policy = approval_policy_for(action)
    required_roles = set(policy["required_approver_roles"])
    if not required_roles:
        return "Approved"
    if required_roles.issubset(approved_roles_for(action)):
        if policy["requires_distinct_approvers"] and len(approved_actors_for(action)) < 2:
            return "PartiallyApproved"
        return "Approved"
    return "PartiallyApproved" if approved_roles_for(action) else "ApprovalRequested"


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
    result = {
        "kind": "redteam_ax_v2_roe_evaluation",
        "case_id": case_id,
        "decision": decision,
        "risk_class": risk_class,
        "hitl_required": risk_class in HIGH_RISK_CLASSES,
        "failures": failures,
        "evaluated_at": now_utc(),
    }
    if case_id:
        append_artifact_metadata(result, "roe", stable_id("ROE", [case_id, risk_class, failures]))
    return result


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
    approval_policy = approval_policy_for({
        "risk_class": risk_class,
        "environment": payload.get("environment") or "approved_scope",
        "action_type": payload.get("action_type") or "analysis_support",
    })
    allowed_buttons = ["Plan", "Select Tool", "Validate Scope", "Record Manual Run", "Import Output", "Create Evidence", "Generate Finding Draft"]
    if not approval_required:
        allowed_buttons.insert(4, "Dry Run")
    else:
        allowed_buttons.insert(4, "Request Approval")

    action_id = str(payload.get("action_id") or stable_id("TAC", [case_id, title, objective, risk_class]))
    result = {
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
        "approval_policy": approval_policy,
        "required_approver_roles": approval_policy["required_approver_roles"],
        "approval_required": approval_required,
        "hitl_required": approval_required,
        "allowed_buttons": allowed_buttons,
        "prohibited_actions": prohibited_actions,
        "status": status,
        "roe_evaluation": roe,
        "audit_events": [{"event": "planned", "at": now_utc(), "actor": payload.get("requested_by") or "analyst"}],
    }
    return append_artifact_metadata(result, "tool-actions", action_id)


def request_tool_action_approval(action_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    case_id = str(payload.get("case_id") or "").strip() or None
    action = load_tool_action(action_id, case_id)
    if action is None:
        return {
            "kind": "redteam_ax_v2_approval_request",
            "action_id": action_id,
            "status": "not_found",
            "errors": ["tool_action_not_found"],
        }

    requested_by = str(payload.get("requested_by") or "").strip()
    justification = str(payload.get("justification") or "").strip()
    errors: list[str] = []
    if not requested_by:
        errors.append("requested_by_required")
    if not justification:
        errors.append("justification_required")

    risk_class = normalize_risk_class(action.get("risk_class"))
    policy = approval_policy_for(action)
    request_id = stable_id("APR", [action_id, requested_by, justification, now_utc()])
    approval_request = {
        "kind": "redteam_ax_v2_approval_request",
        "request_id": request_id,
        "case_id": action.get("case_id") or "CASE-UNSPECIFIED",
        "action_id": action_id,
        "status": "invalid" if errors else "ApprovalRequested",
        "errors": errors,
        "requested_by": requested_by,
        "requested_at": now_utc(),
        "justification": justification,
        "required_approvers": policy["required_approver_roles"],
        "required_approver_roles": policy["required_approver_roles"],
        "approval_mode": policy["approval_mode"],
        "risk_class": risk_class,
    }
    append_artifact_metadata(approval_request, "approvals", request_id)
    if not errors:
        action["status"] = "ApprovalRequested"
        action["approval_request_id"] = request_id
        action.setdefault("audit_events", []).append({"event": "approval_requested", "at": now_utc(), "actor": requested_by})
        persist_tool_action(action, {"event": "approval_requested", "request_id": request_id, "actor": requested_by})
    return {**approval_request, "action": action}


def approve_tool_action(action_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    case_id = str(payload.get("case_id") or "").strip() or None
    action = load_tool_action(action_id, case_id)
    if action is None:
        return {
            "kind": "redteam_ax_v2_approval_decision",
            "action_id": action_id,
            "status": "not_found",
            "errors": ["tool_action_not_found"],
        }

    approver = str(payload.get("approver") or payload.get("approved_by") or "").strip()
    approver_role = normalize_approver_role(payload.get("approver_role") or payload.get("role"))
    decision = str(payload.get("decision") or "approve").strip().lower()
    conditions = payload.get("conditions") or []
    policy = approval_policy_for(action)
    required_roles = set(policy["required_approver_roles"])
    errors: list[str] = []
    if not approver:
        errors.append("approver_required")
    if decision == "approve" and required_roles and not approver_role:
        errors.append("approver_role_required")
    if decision == "approve" and approver_role and approver_role not in required_roles:
        errors.append("approver_role_not_authorized")
    if decision == "approve" and approver_role in approved_roles_for(action):
        errors.append("approver_role_already_satisfied")
    if decision == "approve" and policy["requires_distinct_approvers"] and approver.lower() in approved_actors_for(action):
        errors.append("two_person_approval_requires_distinct_approvers")
    if decision not in {"approve", "reject"}:
        errors.append("decision_must_be_approve_or_reject")

    decision_id = stable_id("APD", [action_id, approver, approver_role, decision, conditions, now_utc()])
    projected_action = {
        **action,
        "approval_decisions": [
            *(action.get("approval_decisions") or []),
            {
                "decision_id": decision_id,
                "approver": approver,
                "approver_role": approver_role,
                "decision": decision,
                "conditions": conditions,
                "decided_at": now_utc(),
            },
        ],
    }
    decision_status = "invalid" if errors else ("Rejected" if decision == "reject" else approval_status_for(projected_action))
    approval_decision = {
        "kind": "redteam_ax_v2_approval_decision",
        "decision_id": decision_id,
        "case_id": action.get("case_id") or "CASE-UNSPECIFIED",
        "action_id": action_id,
        "status": decision_status,
        "errors": errors,
        "approver": approver,
        "approver_role": approver_role,
        "decision": decision,
        "conditions": conditions,
        "required_approver_roles": policy["required_approver_roles"],
        "approval_mode": policy["approval_mode"],
        "decided_at": now_utc(),
    }
    append_artifact_metadata(approval_decision, "approvals", decision_id)
    if not errors:
        action["status"] = decision_status
        action["approval_decision_id"] = decision_id
        action["approval_conditions"] = conditions
        action["approval_policy"] = policy
        action["required_approver_roles"] = policy["required_approver_roles"]
        action["approval_decisions"] = projected_action["approval_decisions"]
        if decision == "approve" and decision_status == "Approved" and "Run in Lab" not in action.get("allowed_buttons", []):
            action.setdefault("allowed_buttons", []).append("Run in Lab")
        action.setdefault("audit_events", []).append({"event": "approval_decided", "at": now_utc(), "actor": approver, "approver_role": approver_role, "decision": decision, "status": decision_status})
        persist_tool_action(action, {"event": "approval_decided", "decision_id": decision_id, "actor": approver, "approver_role": approver_role, "decision": decision, "status": decision_status})
    return {**approval_decision, "action": action}


def record_manual_run(action_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    executed_by = str(payload.get("executed_by") or "").strip()
    uploaded_artifacts = payload.get("uploaded_artifacts") or []
    case_id = str(payload.get("case_id") or "CASE-UNSPECIFIED")
    action = load_tool_action(action_id, case_id)
    errors: list[str] = []
    if not executed_by:
        errors.append("executed_by_required")
    if not isinstance(uploaded_artifacts, list) or not uploaded_artifacts:
        errors.append("uploaded_artifacts_required")
    if action is None:
        errors.append("tool_action_card_required_before_manual_run")
    if action and normalize_risk_class(action.get("risk_class")) in HIGH_RISK_CLASSES and str(action.get("status") or "") != "Approved":
        errors.append("approval_required_before_manual_run")

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
    result = {
        "kind": "redteam_ax_v2_manual_run_record",
        "run_id": run_id,
        "case_id": case_id,
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
    return append_artifact_metadata(result, "manual-runs", run_id)


def import_tool_run_output(run_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    case_id = str(payload.get("case_id") or "CASE-UNSPECIFIED")
    manual_run = load_json_record(run_id, "manual-runs", case_id)
    errors: list[str] = []
    if manual_run is None:
        errors.append("manual_run_record_required")
    elif manual_run.get("status") != "ManuallyExecuted":
        errors.append("manual_run_must_be_manually_executed")

    raw_artifacts = payload.get("raw_artifacts") or payload.get("uploaded_artifacts") or []
    if not isinstance(raw_artifacts, list) or not raw_artifacts:
        errors.append("raw_artifacts_required")

    imported_artifacts = [
        {
            "artifact_id": stable_id("ART", [run_id, artifact]),
            "source_path_or_ref": artifact if isinstance(artifact, str) else artifact.get("source_path_or_ref") or artifact.get("path") or artifact,
            "hash": stable_id("SHA256", [run_id, artifact]),
            "content_type": "application/octet-stream" if isinstance(artifact, str) else artifact.get("content_type", "application/octet-stream"),
            "summary": "" if isinstance(artifact, str) else artifact.get("summary", ""),
            "imported_at": now_utc(),
        }
        for artifact in raw_artifacts
    ]
    action_id = str(payload.get("action_id") or (manual_run or {}).get("action_id") or "")
    tool_run = {
        "kind": "redteam_ax_v2_tool_run_record",
        "run_id": run_id,
        "case_id": case_id,
        "action_id": action_id,
        "tool_id": payload.get("tool_id") or "TOOL-MANUAL-RECORDER",
        "execution_mode": payload.get("execution_mode") or "manual_operator_run",
        "environment": payload.get("environment") or "approved_scope",
        "executed_by": (manual_run or {}).get("executed_by") or payload.get("executed_by"),
        "status": "invalid" if errors else "OutputImported",
        "errors": errors,
        "raw_artifacts": imported_artifacts,
        "normalized_results": [],
        "evidence_candidates": [],
        "notes": payload.get("notes") or (manual_run or {}).get("notes") or "",
    }
    append_artifact_metadata(tool_run, "tool-runs", run_id)
    if action_id and not errors:
        action = load_tool_action(action_id, case_id)
        if action is not None:
            action["status"] = "OutputImported"
            action.setdefault("audit_events", []).append({"event": "output_imported", "at": now_utc(), "run_id": run_id})
            persist_tool_action(action, {"event": "output_imported", "run_id": run_id})
    return tool_run


def normalize_tool_run(run_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    case_id = str(payload.get("case_id") or "CASE-UNSPECIFIED")
    tool_run = load_json_record(run_id, "tool-runs", case_id)
    errors: list[str] = []
    if tool_run is None:
        errors.append("tool_run_record_required")
    elif tool_run.get("status") not in {"OutputImported", "Normalized", "EvidenceCreated"}:
        errors.append("tool_run_output_must_be_imported")

    raw_artifacts = (tool_run or {}).get("raw_artifacts") or []
    structured_items = payload.get("structured_items")
    if structured_items is None:
        structured_items = [
            {
                "item_type": payload.get("result_type") or "artifact_observation",
                "artifact_id": artifact.get("artifact_id"),
                "source_path_or_ref": artifact.get("source_path_or_ref"),
                "confidence": payload.get("confidence", 0.75),
            }
            for artifact in raw_artifacts
        ]
    if not structured_items:
        errors.append("structured_items_required")

    result_id = str(payload.get("result_id") or stable_id("NR", [run_id, structured_items, payload.get("summary")]))
    normalized = {
        "kind": "redteam_ax_v2_tool_result_normalized",
        "result_id": result_id,
        "case_id": case_id,
        "run_id": run_id,
        "action_id": (tool_run or {}).get("action_id"),
        "result_type": payload.get("result_type") or "artifact_observation",
        "summary": payload.get("summary") or f"{len(structured_items)} tool output item(s) normalized for analyst review.",
        "observations": payload.get("observations") or [],
        "limitations": payload.get("limitations") or ["Tool output is evidence candidate material and does not prove compromise without analyst review."],
        "structured_items": structured_items,
        "recommended_next_actions": payload.get("recommended_next_actions") or ["Review normalized output and create EvidenceCard candidates."],
        "prohibited_report_claims": payload.get("prohibited_report_claims") or [
            "Do not claim compromise from tool output alone.",
            "Do not promote candidates to findings without approved EvidenceCard links.",
        ],
        "status": "invalid" if errors else "Normalized",
        "errors": errors,
        "normalized_at": now_utc(),
    }
    append_artifact_metadata(normalized, "normalized-results", result_id)
    if tool_run is not None and not errors:
        normalized_refs = list(tool_run.get("normalized_results") or [])
        if result_id not in normalized_refs:
            normalized_refs.append(result_id)
        tool_run["normalized_results"] = normalized_refs
        tool_run["status"] = "Normalized"
        append_artifact_metadata(tool_run, "tool-runs", run_id)
        action = load_tool_action(str(tool_run.get("action_id") or ""), case_id)
        if action is not None:
            action["status"] = "Normalized"
            action.setdefault("audit_events", []).append({"event": "tool_run_normalized", "at": now_utc(), "run_id": run_id, "result_id": result_id})
            persist_tool_action(action, {"event": "tool_run_normalized", "run_id": run_id, "result_id": result_id})
    return normalized


def create_evidence_from_tool_run(run_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    case_id = str(payload.get("case_id") or "CASE-UNSPECIFIED")
    tool_run = load_json_record(run_id, "tool-runs", case_id)
    errors: list[str] = []
    if tool_run is None:
        errors.append("tool_run_record_required")

    result_id = str(payload.get("result_id") or "")
    if not result_id and tool_run is not None:
        normalized_refs = tool_run.get("normalized_results") or []
        result_id = str(normalized_refs[-1]) if normalized_refs else ""
    normalized = load_json_record(result_id, "normalized-results", case_id) if result_id else None
    if normalized is None:
        errors.append("normalized_result_required")

    source_path = (normalized or {}).get("artifact_path") or f"tool-run://{run_id}/{result_id or 'missing-normalized-result'}"
    evidence = create_evidence_card({
        "case_id": case_id,
        "source_type": payload.get("source_type") or "tool_normalized_result",
        "source_path_or_url": source_path,
        "summary": payload.get("summary") or (normalized or {}).get("summary") or "Normalized tool result requires analyst review.",
        "normalized_fields": {
            "run_id": run_id,
            "result_id": result_id,
            "result_type": (normalized or {}).get("result_type"),
            "structured_items": (normalized or {}).get("structured_items") or [],
            "prohibited_report_claims": (normalized or {}).get("prohibited_report_claims") or [],
        },
        "validation_status": payload.get("validation_status") or "candidate",
    })
    evidence["kind"] = "redteam_ax_v2_evidence_candidate"
    evidence["errors"] = [*(evidence.get("errors") or []), *errors]
    evidence["validation_status"] = "candidate" if evidence["errors"] else evidence.get("validation_status", "candidate")
    append_artifact_metadata(evidence, "evidence", evidence["evidence_id"])

    if tool_run is not None and not errors:
        evidence_refs = list(tool_run.get("evidence_candidates") or [])
        if evidence["evidence_id"] not in evidence_refs:
            evidence_refs.append(evidence["evidence_id"])
        tool_run["evidence_candidates"] = evidence_refs
        tool_run["status"] = "EvidenceCreated"
        append_artifact_metadata(tool_run, "tool-runs", run_id)
        action = load_tool_action(str(tool_run.get("action_id") or ""), case_id)
        if action is not None:
            action["status"] = "EvidenceCreated"
            action.setdefault("audit_events", []).append({"event": "evidence_candidate_created", "at": now_utc(), "run_id": run_id, "evidence_id": evidence["evidence_id"]})
            persist_tool_action(action, {"event": "evidence_candidate_created", "run_id": run_id, "evidence_id": evidence["evidence_id"]})
    return evidence


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
    result = {
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
    return append_artifact_metadata(result, "evidence", evidence_id)


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
    result = {
        "kind": "redteam_ax_v2_report_validation",
        "case_id": str(payload.get("case_id") or "CASE-UNSPECIFIED"),
        "gate_status": gate_status,
        "unsupported_claim_count": len(unsupported_claims),
        "unapproved_high_risk_count": len(unapproved_high_risk),
        "finding_without_evidence_count": len(findings_without_evidence),
        "blocking_items": blocking_items,
        "validated_at": now_utc(),
    }
    return append_artifact_metadata(result, "report-validations", stable_id("RV", [result["case_id"], gate_status, blocking_items]))


def render_korean_report_markdown(payload: dict[str, Any], validation: dict[str, Any]) -> str:
    title = payload.get("title") or "Red Team Report v2"
    case_id = str(payload.get("case_id") or validation.get("case_id") or "CASE-UNSPECIFIED")
    claims = payload.get("claims") or []
    findings = payload.get("findings") or []
    tool_actions = payload.get("tool_actions") or []
    lines = [
        f"# {title}",
        "",
        "## 문서 통제",
        "",
        f"- Case ID: `{case_id}`",
        f"- 생성 시각: `{now_utc()}`",
        "- 문서 유형: Korean Red Team Report v2",
        "- 통제 원칙: ROE/HITL/가드레일 통과 결과와 Evidence Card만 보고서 주장에 사용",
        "",
        "## Campaign Walkthrough",
        "",
        "- 승인된 범위의 ToolActionCard 기반 수행 과정을 기록한다.",
        "- 고위험 실행은 사람이 승인, 수행, 검토한 ManualRunRecord만 반영한다.",
        "",
        "## Evidence Card Index",
        "",
    ]
    evidence_ids = sorted({evidence_id for claim in claims for evidence_id in claim.get("evidence_ids", [])})
    if evidence_ids:
        lines.extend(f"- `{evidence_id}`" for evidence_id in evidence_ids)
    else:
        lines.append("- 승인된 Evidence Card 없음")
    lines.extend([
        "",
        "## Claim-Evidence Matrix",
        "",
        "| Claim | Support | Evidence |",
        "|---|---|---|",
    ])
    for claim in claims:
        lines.append(f"| `{claim.get('claim_id') or claim.get('id')}` | {claim.get('support_level') or 'supported'} | {', '.join(claim.get('evidence_ids') or [])} |")
    lines.extend([
        "",
        "## Findings",
        "",
    ])
    for finding in findings:
        lines.append(f"- `{finding.get('finding_id') or finding.get('id')}` {finding.get('title') or 'Finding'} / Evidence: {', '.join(finding.get('evidence_ids') or [])}")
    lines.extend([
        "",
        "## ToolAction / HITL Summary",
        "",
    ])
    for action in tool_actions:
        lines.append(f"- `{action.get('action_id') or action.get('id')}` risk={normalize_risk_class(action.get('risk_class'))} status={action.get('status')} approval_required={action.get('approval_required')}")
    lines.extend([
        "",
        "## Report Gate",
        "",
        f"- Gate status: `{validation['gate_status']}`",
        f"- Unsupported claims: `{validation['unsupported_claim_count']}`",
        f"- Unapproved high-risk actions: `{validation['unapproved_high_risk_count']}`",
        f"- Findings without evidence: `{validation['finding_without_evidence_count']}`",
        "",
        "## 재시험 계획",
        "",
        "- Evidence-linked finding별 remediation owner와 retest window를 지정한다.",
        "- 재시험 결과도 Evidence Card로 승격한 뒤 Claim-Evidence Matrix에 연결한다.",
        "",
    ])
    return "\n".join(lines)


def write_report_artifact(case_id: str, report_id: str, markdown: str) -> str:
    path = case_dir(case_id) / "reports"
    path.mkdir(parents=True, exist_ok=True)
    report_path = path / f"{safe_name(report_id)}.md"
    report_path.write_text(markdown, encoding="utf-8", newline="\n")
    return report_path.as_posix()


def generate_report(payload: dict[str, Any]) -> dict[str, Any]:
    validation = validate_report(payload)
    case_id = str(payload.get("case_id") or validation.get("case_id") or "CASE-UNSPECIFIED")
    report_id = stable_id("RTRPT", [case_id, payload.get("title"), validation["validated_at"]])
    report = None
    artifact_path = None
    if validation["gate_status"] == "pass":
        markdown = render_korean_report_markdown({**payload, "case_id": case_id}, validation)
        artifact_path = write_report_artifact(case_id, report_id, markdown)
        report = {
            "report_id": report_id,
            "title": payload.get("title") or "Red Team Report v2",
            "language": "ko",
            "artifact_path": artifact_path,
            "sections": [
                "문서 통제",
                "캠페인 Walkthrough",
                "Evidence Card Index",
                "Claim-Evidence Matrix",
                "Findings",
                "재시험 계획",
            ],
        }
        write_case_event(case_id, {
            "event": "korean_report_v2_generated",
            "record_id": report_id,
            "artifact_path": artifact_path,
        })
    result = {
        "kind": "redteam_ax_v2_korean_report_draft",
        "case_id": case_id,
        "report_id": report_id,
        "gate_status": validation["gate_status"],
        "validation": validation,
        "report": report,
    }
    return append_artifact_metadata(result, "reports", report_id)


def report_gate_snapshot(report: dict[str, Any]) -> dict[str, Any]:
    validation = report.get("validation") or {}
    blocking_items = validation.get("blocking_items") or []
    return {
        "gate_status": report.get("gate_status") or validation.get("gate_status") or "blocked",
        "unsupported_claim_count": int(validation.get("unsupported_claim_count") or 0),
        "unapproved_high_risk_count": int(validation.get("unapproved_high_risk_count") or 0),
        "finding_without_evidence_count": int(validation.get("finding_without_evidence_count") or 0),
        "blocking_items": blocking_items,
    }


def report_export_gate_errors(report: dict[str, Any] | None) -> list[str]:
    if report is None:
        return ["report_not_found"]
    snapshot = report_gate_snapshot(report)
    errors: list[str] = []
    if snapshot["gate_status"] != "pass":
        errors.append("report_validation_gate_not_passed")
    if snapshot["unsupported_claim_count"] != 0:
        errors.append("unsupported_claims_present")
    if snapshot["unapproved_high_risk_count"] != 0:
        errors.append("unapproved_high_risk_actions_present")
    if snapshot["finding_without_evidence_count"] != 0:
        errors.append("findings_without_evidence_present")
    if snapshot["blocking_items"]:
        errors.append("report_validation_blocking_items_present")
    if not (report.get("report") or {}).get("artifact_path"):
        errors.append("report_artifact_required")
    return errors


def approve_report_export(report_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    case_id = str(payload.get("case_id") or "").strip() or None
    report = load_json_record(report_id, "reports", case_id=case_id)
    errors = report_export_gate_errors(report)
    approver = str(payload.get("approved_by") or payload.get("approver") or "").strip()
    approver_role = normalize_approver_role(payload.get("approver_role"))
    decision = str(payload.get("decision") or "approve").strip().lower()

    if not approver:
        errors.append("approved_by_required")
    if approver_role not in REPORT_EXPORT_APPROVER_ROLES:
        errors.append("executive_sponsor_approval_required")
    if decision != "approve":
        errors.append("approval_decision_must_be_approve")

    resolved_case_id = str((report or {}).get("case_id") or payload.get("case_id") or "CASE-UNSPECIFIED")
    approval_id = stable_id("RTA", [resolved_case_id, report_id, approver, approver_role, now_utc()])
    result = {
        "kind": "redteam_ax_v2_report_export_approval",
        "approval_id": approval_id,
        "report_id": report_id,
        "case_id": resolved_case_id,
        "status": "ExportApproved" if not errors else "invalid",
        "decision": decision,
        "approved_by": approver,
        "approver_role": approver_role,
        "required_approver_roles": sorted(REPORT_EXPORT_APPROVER_ROLES),
        "gate_snapshot": report_gate_snapshot(report) if report else None,
        "approved_at": now_utc() if not errors else None,
        "errors": errors,
    }
    category = "report-export-approvals"
    return append_artifact_metadata(result, category, approval_id)


def export_report(report_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    case_id = str(payload.get("case_id") or "").strip() or None
    report = load_json_record(report_id, "reports", case_id=case_id)
    errors = report_export_gate_errors(report)
    approval_id = str(payload.get("approval_id") or "").strip()
    approval = load_json_record(approval_id, "report-export-approvals", case_id=case_id) if approval_id else None

    if not approval_id:
        errors.append("report_export_approval_required")
    elif approval is None:
        errors.append("report_export_approval_not_found")
    else:
        if approval.get("report_id") != report_id:
            errors.append("report_export_approval_report_mismatch")
        if approval.get("status") != "ExportApproved":
            errors.append("report_export_approval_not_approved")
        if normalize_approver_role(approval.get("approver_role")) not in REPORT_EXPORT_APPROVER_ROLES:
            errors.append("executive_sponsor_approval_required")

    resolved_case_id = str((report or {}).get("case_id") or (approval or {}).get("case_id") or payload.get("case_id") or "CASE-UNSPECIFIED")
    export_id = stable_id("RTEXP", [resolved_case_id, report_id, approval_id or "unapproved", now_utc()])
    report_artifact_path = ((report or {}).get("report") or {}).get("artifact_path")
    result = {
        "kind": "redteam_ax_v2_report_export",
        "export_id": export_id,
        "report_id": report_id,
        "case_id": resolved_case_id,
        "status": "Exported" if not errors else "blocked",
        "approval_id": approval_id or None,
        "approved_by": (approval or {}).get("approved_by"),
        "approver_role": (approval or {}).get("approver_role"),
        "report_artifact_path": report_artifact_path,
        "gate_snapshot": report_gate_snapshot(report) if report else None,
        "exported_at": now_utc() if not errors else None,
        "errors": errors,
    }
    return append_artifact_metadata(result, "exports", export_id)
