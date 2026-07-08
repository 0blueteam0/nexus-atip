from __future__ import annotations

import copy
import hashlib
from datetime import datetime, timezone
from typing import Any, Callable


StepExecutor = Callable[[dict[str, Any], dict[str, Any], dict[str, Any]], dict[str, Any]]

JOB_STORE: dict[str, dict[str, Any]] = {}


def now_utc() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def stable_id(prefix: str, parts: list[Any]) -> str:
    raw = "|".join(str(part) for part in parts)
    digest = hashlib.sha256(raw.encode("utf-8")).hexdigest()[:12].upper()
    return f"{prefix}-{digest}"


def workflow_template() -> list[dict[str, Any]]:
    return [
        {
            "step_id": "intake",
            "section_id": "intake_and_evidence_seal",
            "title": "Evidence seal and case binding",
            "agent": "EvidenceSealAgent",
            "safe_auto_executable": True,
            "requires_human_approval": False,
            "boundary": "seal_only_no_sample_execution",
        },
        {
            "step_id": "triage",
            "section_id": "basic_triage",
            "title": "Basic triage and route selection",
            "agent": "TriageAgent",
            "safe_auto_executable": True,
            "requires_human_approval": False,
            "boundary": "static_metadata_only",
        },
        {
            "step_id": "static_analysis",
            "section_id": "static_analysis",
            "title": "Static analyzer lane",
            "agent": "StaticAnalysisAgent",
            "safe_auto_executable": True,
            "requires_human_approval": False,
            "boundary": "static_read_only_tools",
        },
        {
            "step_id": "format_specific",
            "section_id": "archive_evasion_analysis",
            "title": "Format-specific follow-up",
            "agent": "FormatRouterAgent",
            "safe_auto_executable": True,
            "requires_human_approval": False,
            "boundary": "read_only_unpacking_and_listing",
        },
        {
            "step_id": "dynamic_preflight",
            "section_id": "sandbox_dynamic_preflight",
            "title": "Dynamic sandbox preflight",
            "agent": "SandboxPreflightAgent",
            "safe_auto_executable": True,
            "requires_human_approval": True,
            "approval_gate_id": "HITL-DYNAMIC-PREFLIGHT",
            "boundary": "approval_required_before_vm_cape_or_sample_execution",
        },
        {
            "step_id": "evidence_rag",
            "section_id": "agentic_rag_and_counterevidence",
            "title": "Evidence, counterevidence, and report claim check",
            "agent": "EvidenceRagAgent",
            "safe_auto_executable": True,
            "requires_human_approval": False,
            "boundary": "tool_outputs_are_untrusted_data",
        },
        {
            "step_id": "publish_gate",
            "section_id": "review_approve_publish",
            "title": "Review, approval, and publish gate",
            "agent": "ReviewGateAgent",
            "safe_auto_executable": True,
            "requires_human_approval": True,
            "approval_gate_id": "HITL-REPORT-PUBLISH",
            "boundary": "human_release_approval_required",
        },
    ]


def health() -> dict[str, Any]:
    return {
        "kind": "malax2_workflow_health",
        "status": "ready",
        "api_namespace": "/api/reports/malax/v2",
        "workflow_runtime": "langgraph_compatible_state_machine",
        "safe_by_default": True,
        "human_approval_points": ["dynamic_preflight", "publish_gate"],
        "buttons": ["plan_job", "advance_agent_step", "approve_hitl_step", "refresh_job"],
        "active_job_count": len(JOB_STORE),
    }


def _initial_steps() -> list[dict[str, Any]]:
    steps = copy.deepcopy(workflow_template())
    for index, step in enumerate(steps):
        step["order"] = index + 1
        step["status"] = "ready" if index == 0 else "blocked_by_dependency"
        step["approval_status"] = "not_required" if not step["requires_human_approval"] else "not_requested"
        step["agent_trace"] = []
        step["evidence_refs"] = []
        step["output_summary"] = ""
    return steps


def _graph_from_steps(steps: list[dict[str, Any]]) -> dict[str, Any]:
    node_ids = [step["step_id"] for step in steps]
    return {
        "graph_id": "MALAX2.analysis_workflow_job",
        "runtime": "langgraph_compatible_state_machine",
        "nodes": [
            {
                "id": step["step_id"],
                "agent": step["agent"],
                "requires_human_approval": step["requires_human_approval"],
                "section_id": step.get("section_id"),
            }
            for step in steps
        ],
        "edges": [
            {"from": node_ids[index], "to": node_ids[index + 1], "condition": "completed_or_approved"}
            for index in range(len(node_ids) - 1)
        ],
        "checkpoint_policy": "job_id_plus_step_status",
    }


def _summarize(job: dict[str, Any]) -> dict[str, Any]:
    steps = job.get("steps") or []
    status_counts: dict[str, int] = {}
    approval_queue = []
    for step in steps:
        status = str(step.get("status") or "unknown")
        status_counts[status] = status_counts.get(status, 0) + 1
        if step.get("requires_human_approval") and step.get("approval_status") != "approved":
            approval_queue.append({
                "step_id": step.get("step_id"),
                "approval_gate_id": step.get("approval_gate_id"),
                "status": step.get("status"),
                "reason": step.get("boundary"),
            })
    job["summary"] = {
        "step_count": len(steps),
        "completed_count": status_counts.get("completed", 0),
        "blocked_count": status_counts.get("blocked", 0),
        "awaiting_approval_count": status_counts.get("awaiting_human_approval", 0),
        "status_counts": status_counts,
        "approval_queue": approval_queue,
        "trace_count": len(job.get("agent_step_trace") or []),
    }
    return job


def plan_job(payload: dict[str, Any]) -> dict[str, Any]:
    created_at = now_utc()
    report_id = str(payload.get("report_id") or payload.get("reportId") or "MAR-REPORT-UNBOUND").strip()
    case_id = str(payload.get("case_id") or payload.get("caseId") or report_id).strip()
    objective = str(payload.get("objective") or "Operator-triggered MALAX2 workflow job").strip()
    steps = _initial_steps()
    job_id = str(payload.get("job_id") or stable_id("MALAX2JOB", [case_id, report_id, objective, created_at]))
    job = {
        "kind": "malax2_workflow_job",
        "job_id": job_id,
        "case_id": case_id,
        "report_id": report_id,
        "objective": objective,
        "workflow_status": "planned",
        "current_step_id": steps[0]["step_id"] if steps else None,
        "created_at": created_at,
        "updated_at": created_at,
        "created_by": payload.get("requested_by") or "report-studio-analyst",
        "graph": _graph_from_steps(steps),
        "steps": steps,
        "agent_step_trace": [],
        "human_approval_events": [],
        "safety_boundary": {
            "sample_execution_default": False,
            "raw_sample_bytes_sent_to_llm_or_mcp": False,
            "tool_outputs_trusted_as_instruction": False,
            "dynamic_execution_requires_human_approval": True,
            "publish_requires_human_approval": True,
        },
        "available_buttons": ["advance_agent_step", "refresh_job"],
        "audit_events": [{"event": "job_planned", "at": created_at, "actor": payload.get("requested_by") or "report-studio-analyst"}],
    }
    JOB_STORE[job_id] = _summarize(job)
    return copy.deepcopy(JOB_STORE[job_id])


def get_job(job_id: str) -> dict[str, Any]:
    job = JOB_STORE.get(str(job_id))
    if not job:
        return {"ok": False, "kind": "malax2_workflow_job", "job_id": job_id, "error": "job_not_found"}
    return copy.deepcopy(_summarize(job))


def _step_index(job: dict[str, Any], step_id: str) -> int:
    for index, step in enumerate(job.get("steps") or []):
        if step.get("step_id") == step_id:
            return index
    return -1


def _next_step(job: dict[str, Any]) -> tuple[int, dict[str, Any] | None]:
    for index, step in enumerate(job.get("steps") or []):
        if step.get("status") not in {"completed", "skipped"}:
            return index, step
    return -1, None


def approve_step(job_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    job = JOB_STORE.get(str(job_id))
    if not job:
        return {"ok": False, "job_id": job_id, "status": "invalid", "errors": ["job_not_found"]}
    step_id = str(payload.get("step_id") or payload.get("approval_step_id") or "").strip()
    approved_by = str(payload.get("approved_by") or payload.get("reviewed_by") or "").strip()
    errors = []
    if not step_id:
        errors.append("step_id_required")
    if not approved_by:
        errors.append("approved_by_required")
    index = _step_index(job, step_id)
    if index < 0:
        errors.append("step_not_found")
    elif not job["steps"][index].get("requires_human_approval"):
        errors.append("step_does_not_require_approval")
    if errors:
        return {"ok": False, "job_id": job_id, "status": "invalid", "errors": errors}

    approved_at = now_utc()
    step = job["steps"][index]
    step["approval_status"] = "approved"
    step["approval"] = {
        "approval_id": stable_id("HITL", [job_id, step_id, approved_by, approved_at]),
        "step_id": step_id,
        "approved_by": approved_by,
        "role": payload.get("role") or "lead_analyst",
        "decision": "approved",
        "conditions": payload.get("conditions") or ["stay_within_malax2_safety_boundary"],
        "approved_at": approved_at,
    }
    previous_completed = index == 0 or job["steps"][index - 1].get("status") == "completed"
    if previous_completed and step.get("status") in {"awaiting_human_approval", "blocked_by_dependency", "ready"}:
        step["status"] = "approved"
        job["current_step_id"] = step_id
    job["workflow_status"] = "approved_waiting_for_agent" if step["status"] == "approved" else job.get("workflow_status")
    job["updated_at"] = approved_at
    event = {"event": "human_approval_recorded", "at": approved_at, "actor": approved_by, "step_id": step_id}
    job.setdefault("human_approval_events", []).append(step["approval"])
    job.setdefault("audit_events", []).append(event)
    JOB_STORE[str(job_id)] = _summarize(job)
    return {"ok": True, "status": "approved", "job": copy.deepcopy(JOB_STORE[str(job_id)]), "approval": step["approval"]}


def _extract_evidence_refs(result: dict[str, Any]) -> list[str]:
    refs: list[str] = []
    for key in ("evidence_ids", "evidence_refs"):
        value = result.get(key)
        if isinstance(value, list):
            refs.extend(str(item) for item in value if item)
    evidence = result.get("evidence")
    if isinstance(evidence, list):
        refs.extend(str(item.get("record_id") or item.get("evidence_id")) for item in evidence if isinstance(item, dict))
    return sorted({item for item in refs if item})


def advance_job(job_id: str, payload: dict[str, Any] | None = None, section_executor: StepExecutor | None = None) -> dict[str, Any]:
    payload = payload or {}
    job = JOB_STORE.get(str(job_id))
    if not job:
        return {"ok": False, "job_id": job_id, "status": "invalid", "errors": ["job_not_found"]}
    index, step = _next_step(job)
    if not step:
        job["workflow_status"] = "completed"
        job["updated_at"] = now_utc()
        JOB_STORE[str(job_id)] = _summarize(job)
        return {"ok": True, "status": "completed", "job": copy.deepcopy(JOB_STORE[str(job_id)])}

    at = now_utc()
    if step.get("requires_human_approval") and step.get("approval_status") != "approved":
        step["status"] = "awaiting_human_approval"
        step["approval_status"] = "requested"
        job["workflow_status"] = "awaiting_human_approval"
        job["current_step_id"] = step.get("step_id")
        event = {
            "event": "agent_step_paused_for_human_approval",
            "at": at,
            "actor": payload.get("operator") or "workflow-agent",
            "step_id": step.get("step_id"),
            "approval_gate_id": step.get("approval_gate_id"),
        }
        job.setdefault("agent_step_trace", []).append(event)
        job.setdefault("audit_events", []).append(event)
        job["updated_at"] = at
        JOB_STORE[str(job_id)] = _summarize(job)
        return {"ok": True, "status": "awaiting_human_approval", "job": copy.deepcopy(JOB_STORE[str(job_id)]), "step": copy.deepcopy(step)}

    step["status"] = "running"
    step["started_at"] = at
    executor_result: dict[str, Any]
    try:
        if section_executor and step.get("safe_auto_executable"):
            executor_result = section_executor(job, step, payload)
        else:
            executor_result = {
                "ok": True,
                "state": "tracked_without_backend_execution",
                "section_id": step.get("section_id"),
                "message": "MALAX2 agent step was tracked without backend section execution.",
            }
    except Exception as exc:  # pragma: no cover - defensive runtime boundary
        executor_result = {"ok": False, "state": "executor_error", "error": str(exc), "section_id": step.get("section_id")}

    sample_executed = bool(
        executor_result.get("sample_executed")
        or executor_result.get("safety", {}).get("sample_executed")
        or executor_result.get("policy", {}).get("sample_executed")
    )
    if executor_result.get("ok") is False or sample_executed:
        step["status"] = "blocked"
        job["workflow_status"] = "blocked"
        if sample_executed:
            executor_result = {**executor_result, "policy_violation": "sample_execution_not_allowed_in_malax2_agent_boundary"}
    else:
        step["status"] = "completed"
        if index + 1 < len(job["steps"]) and job["steps"][index + 1].get("status") == "blocked_by_dependency":
            job["steps"][index + 1]["status"] = "ready"
            job["current_step_id"] = job["steps"][index + 1].get("step_id")
            job["workflow_status"] = "running"
        else:
            job["current_step_id"] = None
            job["workflow_status"] = "completed"
    completed_at = now_utc()
    step["completed_at"] = completed_at
    step["executor_result_state"] = executor_result.get("state") or ("succeeded" if executor_result.get("ok", True) else "blocked")
    step["evidence_refs"] = _extract_evidence_refs(executor_result)
    step["output_summary"] = executor_result.get("message") or executor_result.get("reason") or step["executor_result_state"]
    event = {
        "event": "agent_step_advanced",
        "at": completed_at,
        "actor": payload.get("operator") or step.get("agent") or "workflow-agent",
        "step_id": step.get("step_id"),
        "section_id": step.get("section_id"),
        "status": step.get("status"),
        "executor_result_state": step.get("executor_result_state"),
        "sample_executed": sample_executed,
    }
    step.setdefault("agent_trace", []).append(event)
    job.setdefault("agent_step_trace", []).append(event)
    job.setdefault("audit_events", []).append(event)
    job["updated_at"] = completed_at
    JOB_STORE[str(job_id)] = _summarize(job)
    return {
        "ok": step["status"] != "blocked",
        "status": step["status"],
        "job": copy.deepcopy(JOB_STORE[str(job_id)]),
        "step": copy.deepcopy(step),
        "executor_result": executor_result,
    }
