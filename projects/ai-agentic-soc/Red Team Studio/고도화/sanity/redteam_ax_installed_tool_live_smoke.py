from __future__ import annotations

import json
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path

from fastapi.testclient import TestClient


PROJECT_ROOT = Path(__file__).resolve().parents[3]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from runtime import malware_upload_api  # noqa: E402


ARTIFACT_DIR = PROJECT_ROOT / "archive" / "runs" / "redteam-ax-v2-installed-tool-live-smoke"
ARTIFACT_PATH = ARTIFACT_DIR / "latest_installed_tool_live_smoke.json"
CASE_ID = "CASE-V2-INSTALLED-TOOL-LIVE-SMOKE-001"
ACTION_ID = "TAC-NPM-INSTALLED-LIVE-SMOKE-001"
TOOL_ID = "TOOL-NPM-AUDIT-001"


def now_utc() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def write_artifact(payload: dict) -> dict:
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    payload["artifact_path"] = ARTIFACT_PATH.as_posix()
    ARTIFACT_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return payload


def main() -> int:
    npm_path = shutil.which("npm.cmd")
    result = {
        "kind": "redteam_ax_installed_tool_live_smoke",
        "created_at": now_utc(),
        "case_id": CASE_ID,
        "tool_id": TOOL_ID,
        "tool_name": "npm audit",
        "installed_command": npm_path or "",
        "status": "not_started",
        "safe_by_default": True,
        "command_executed": "npm.cmd --version",
        "commands_executed_by_api": False,
        "shell_expansion_allowed": False,
        "trusted_as_instruction": False,
        "requires_human_validation": True,
        "steps": [],
        "errors": [],
    }
    if not npm_path:
        result["status"] = "blocked_tool_not_installed"
        result["errors"].append("npm_cmd_not_found")
        write_artifact(result)
        print(json.dumps({"status": result["status"], "artifact_path": result["artifact_path"], "errors": result["errors"]}, ensure_ascii=False))
        return 0

    client = TestClient(malware_upload_api.app)

    manifest_response = client.get(f"/api/redteam/v2/tool-wrapper-manifests/{TOOL_ID}")
    manifest = manifest_response.json()
    result["steps"].append({"step": "wrapper_manifest", "status_code": manifest_response.status_code, "status": manifest.get("pinning_status"), "actual_sha256": manifest.get("actual_sha256")})
    actual_sha256 = str(manifest.get("actual_sha256") or "").strip()
    if manifest_response.status_code != 200 or not actual_sha256:
        result["status"] = "blocked_wrapper_hash_missing"
        result["errors"].append("npm_wrapper_actual_sha256_missing")
        write_artifact(result)
        print(json.dumps({"status": result["status"], "artifact_path": result["artifact_path"], "errors": result["errors"]}, ensure_ascii=False))
        return 1

    pin_request = client.post(f"/api/redteam/v2/tool-wrapper-pins/{TOOL_ID}/request", json={
        "case_id": CASE_ID,
        "requested_by": "analyst@example.com",
        "expected_sha256": actual_sha256,
        "operator_attested_version": "npm installed-tool live smoke",
        "version_command": "npm.cmd --version",
        "version_output_excerpt": "captured by governed runner in this smoke",
        "version_command_executed_by_operator": True,
    }).json()
    result["steps"].append({"step": "pin_request", "status": pin_request.get("status"), "pin_request_id": pin_request.get("pin_request_id"), "errors": pin_request.get("errors") or []})
    if pin_request.get("status") != "submitted":
        result["status"] = "failed_pin_request"
        result["errors"].extend(pin_request.get("errors") or [])
        write_artifact(result)
        print(json.dumps({"status": result["status"], "artifact_path": result["artifact_path"], "errors": result["errors"]}, ensure_ascii=False))
        return 1

    pin_approval = client.post(
        f"/api/redteam/v2/tool-wrapper-pins/{TOOL_ID}/approve",
        headers={"X-RedTeam-Actor": "lead@example.com", "X-RedTeam-Actor-Role": "red_team_lead"},
        json={
            "case_id": CASE_ID,
            "pin_request_id": pin_request["pin_request_id"],
            "approver": "lead@example.com",
            "approver_role": "red_team_lead",
            "decision": "approve",
        },
    ).json()
    result["steps"].append({"step": "pin_approval", "status": pin_approval.get("status"), "approval_id": pin_approval.get("approval_id"), "errors": pin_approval.get("errors") or []})
    if pin_approval.get("status") != "approved":
        result["status"] = "failed_pin_approval"
        result["errors"].extend(pin_approval.get("errors") or [])
        write_artifact(result)
        print(json.dumps({"status": result["status"], "artifact_path": result["artifact_path"], "errors": result["errors"]}, ensure_ascii=False))
        return 1

    action = client.post("/api/redteam/v2/tool-actions/plan", json={
        "case_id": CASE_ID,
        "action_id": ACTION_ID,
        "title": "npm audit installed tool live smoke",
        "objective": "Run an installed npm.cmd version command through governed RedTeam AX runner and analyze output.",
        "tool_id": TOOL_ID,
        "risk_class": "T0",
        "requested_by": "analyst@example.com",
        "target_scope_refs": ["SCOPE-APPROVED-LOCAL-LAB"],
    }).json()
    result["steps"].append({"step": "tool_action", "status": action.get("status"), "action_id": action.get("action_id")})

    plan = client.post(f"/api/redteam/v2/tool-actions/{ACTION_ID}/execution-plan", json={
        "case_id": CASE_ID,
        "tool_id": TOOL_ID,
        "execution_mode": "sandbox_execute",
        "requested_by": "analyst@example.com",
        "max_runtime_seconds": 20,
        "max_output_bytes": 4096,
    }).json()
    result["steps"].append({"step": "execution_plan", "status": plan.get("status"), "execution_plan_id": plan.get("execution_plan_id"), "token_status": (plan.get("execution_token") or {}).get("status"), "errors": plan.get("errors") or [], "warnings": plan.get("warnings") or []})
    if plan.get("status") != "PlanReady" or (plan.get("execution_token") or {}).get("status") != "issued":
        result["status"] = "failed_execution_plan"
        result["errors"].extend(plan.get("errors") or plan.get("warnings") or ["execution_plan_not_ready"])
        write_artifact(result)
        print(json.dumps({"status": result["status"], "artifact_path": result["artifact_path"], "errors": result["errors"]}, ensure_ascii=False))
        return 1

    run = client.post(f"/api/redteam/v2/tool-actions/{ACTION_ID}/execute-governed", json={
        "case_id": CASE_ID,
        "tool_id": TOOL_ID,
        "execution_mode": "sandbox_execute",
        "requested_by": "analyst@example.com",
        "execution_plan_id": plan["execution_plan_id"],
        "execution_token_id": plan["execution_token"]["token_id"],
        "runner_argv": ["npm.cmd", "--version"],
        "max_runtime_seconds": 20,
        "max_output_bytes": 4096,
    }).json()
    result["steps"].append({"step": "execute_governed", "status": run.get("status"), "run_id": run.get("run_id"), "runner_status": (run.get("runner_attempt") or {}).get("status"), "exit_code": (run.get("runner_attempt") or {}).get("exit_code"), "raw_artifact_count": len(run.get("raw_artifacts") or []), "errors": run.get("errors") or []})
    if run.get("status") != "RunnerExecuted":
        result["status"] = "failed_runner_execution"
        result["errors"].extend(run.get("errors") or ["runner_not_executed"])
        write_artifact(result)
        print(json.dumps({"status": result["status"], "artifact_path": result["artifact_path"], "errors": result["errors"]}, ensure_ascii=False))
        return 1

    sanitizer = client.post(f"/api/redteam/v2/tool-runs/{run['run_id']}/sanitize-preview", json={"case_id": CASE_ID}).json()
    result["steps"].append({"step": "sanitize_preview", "status": sanitizer.get("status"), "input_source": sanitizer.get("input_source"), "trusted_as_instruction": sanitizer.get("trusted_as_instruction"), "errors": sanitizer.get("errors") or []})
    if sanitizer.get("status") not in {"allow", "redact", "needs_review"}:
        result["status"] = "failed_sanitizer"
        result["errors"].extend(sanitizer.get("errors") or ["sanitizer_not_allowing_output"])
        write_artifact(result)
        print(json.dumps({"status": result["status"], "artifact_path": result["artifact_path"], "errors": result["errors"]}, ensure_ascii=False))
        return 1

    normalized = client.post(f"/api/redteam/v2/tool-runs/{run['run_id']}/agent-analyze", json={
        "case_id": CASE_ID,
        "summary": "Installed npm.cmd version output captured by governed runner and normalized for evidence review.",
        "result_type": "tool_install_runtime_evidence",
    }).json()
    result["steps"].append({"step": "agent_analyze", "status": normalized.get("status"), "result_id": normalized.get("result_id"), "parser": (normalized.get("parser_report") or {}).get("parser"), "artifact_input_count": (normalized.get("parser_report") or {}).get("artifact_input_count"), "errors": normalized.get("errors") or []})
    if normalized.get("status") != "Normalized":
        result["status"] = "failed_agent_analyze"
        result["errors"].extend(normalized.get("errors") or ["agent_analyze_not_normalized"])
        write_artifact(result)
        print(json.dumps({"status": result["status"], "artifact_path": result["artifact_path"], "errors": result["errors"]}, ensure_ascii=False))
        return 1

    evidence = client.post(f"/api/redteam/v2/tool-runs/{run['run_id']}/create-evidence", json={
        "case_id": CASE_ID,
        "result_id": normalized["result_id"],
        "summary": "Installed npm.cmd governed runner live smoke output evidence candidate.",
    }).json()
    result["steps"].append({"step": "create_evidence", "status": evidence.get("status"), "evidence_id": evidence.get("evidence_id"), "errors": evidence.get("errors") or []})
    if evidence.get("status") == "invalid":
        result["status"] = "failed_evidence_creation"
        result["errors"].extend(evidence.get("errors") or ["evidence_creation_failed"])
        write_artifact(result)
        print(json.dumps({"status": result["status"], "artifact_path": result["artifact_path"], "errors": result["errors"]}, ensure_ascii=False))
        return 1

    result.update({
        "status": "passed",
        "commands_executed_by_api": True,
        "runner_shell": (run.get("runner_attempt") or {}).get("shell"),
        "run_id": run.get("run_id"),
        "result_id": normalized.get("result_id"),
        "evidence_id": evidence.get("evidence_id"),
        "raw_artifacts": run.get("raw_artifacts") or [],
        "run_artifact_path": run.get("artifact_path"),
        "normalized_artifact_path": normalized.get("artifact_path"),
        "evidence_artifact_path": evidence.get("artifact_path"),
    })
    write_artifact(result)
    print(json.dumps({"status": result["status"], "artifact_path": result["artifact_path"], "run_id": result["run_id"], "evidence_id": result["evidence_id"]}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
