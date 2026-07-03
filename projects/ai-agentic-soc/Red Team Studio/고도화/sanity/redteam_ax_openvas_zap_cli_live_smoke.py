from __future__ import annotations

import hashlib
import json
import os
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

from fastapi.testclient import TestClient


PROJECT_ROOT = Path(__file__).resolve().parents[3]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

TOOL_ROOT = PROJECT_ROOT / "tools" / "redteam-ax"
BIN_DIR = TOOL_ROOT / "bin"
ISOLATED_VENV = TOOL_ROOT / "venvs" / "openvas-zap-cli"
ARTIFACT_DIR = PROJECT_ROOT / "archive" / "runs" / "redteam-ax-v2-openvas-zap-cli-live-smoke"
ARTIFACT_PATH = ARTIFACT_DIR / "latest_openvas_zap_cli_live_smoke.json"
CASE_ID = "CASE-V2-OPENVAS-ZAP-CLI-LIVE-SMOKE-001"

TOOLS = [
    {
        "tool_id": "TOOL-OPENVAS-001",
        "tool_name": "OpenVAS gvm-tools CLI",
        "package": "gvm-tools==26.0.6",
        "shim_name": "gvm-cli.cmd",
        "target_exe": "gvm-cli.exe",
        "runner_argv": ["gvm-cli.CMD", "--version"],
        "version_probe": ["gvm-cli.CMD", "--version"],
        "action_id": "TAC-OPENVAS-CLI-LIVE-SMOKE-001",
    },
    {
        "tool_id": "TOOL-ZAP-001",
        "tool_name": "OWASP ZAP CLI",
        "package": "zapcli==0.10.0",
        "extra_packages": ["python-owasp-zap-v2.4==0.0.14"],
        "shim_name": "zap-cli.cmd",
        "target_exe": "zap-cli.exe",
        "runner_argv": ["zap-cli.CMD", "--help"],
        "version_probe": ["zap-cli.CMD", "--help"],
        "action_id": "TAC-ZAP-CLI-LIVE-SMOKE-001",
    },
]


def now_utc() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def run(argv: list[str], timeout: int = 120) -> dict:
    completed = subprocess.run(
        argv,
        cwd=PROJECT_ROOT,
        shell=False,
        text=True,
        encoding="utf-8",
        errors="replace",
        capture_output=True,
        timeout=timeout,
    )
    return {
        "argv": argv,
        "exit_code": completed.returncode,
        "stdout_excerpt": (completed.stdout or "")[:4000],
        "stderr_excerpt": (completed.stderr or "")[:4000],
    }


def bootstrap_python() -> str:
    configured = os.environ.get("REDTEAM_AX_BOOTSTRAP_PYTHON")
    if configured:
        return configured
    python = shutil.which("python")
    if not python:
        raise AssertionError("python executable with venv module is required to bootstrap isolated OpenVAS/ZAP CLI env")
    return python


def ensure_isolated_venv() -> dict:
    python_exe = ISOLATED_VENV / "Scripts" / "python.exe"
    if not python_exe.exists():
        ISOLATED_VENV.parent.mkdir(parents=True, exist_ok=True)
        created = run([bootstrap_python(), "-m", "venv", str(ISOLATED_VENV)], timeout=180)
        if created["exit_code"] != 0:
            raise AssertionError(f"isolated venv creation failed: {created}")
    else:
        created = {"status": "already_exists", "exit_code": 0}
    packages = ["gvm-tools==26.0.6", "zapcli==0.10.0", "python-owasp-zap-v2.4==0.0.14"]
    targets = [ISOLATED_VENV / "Scripts" / tool["target_exe"] for tool in TOOLS]
    if all(target.exists() for target in targets) and os.environ.get("REDTEAM_AX_FORCE_OPENVAS_ZAP_CLI_INSTALL", "").lower() not in {"1", "true", "yes"}:
        installed = {
            "status": "already_satisfied",
            "exit_code": 0,
            "target_executables": [target.as_posix() for target in targets],
            "network_install_skipped": True,
        }
    else:
        installed = run([str(python_exe), "-m", "pip", "install", *packages], timeout=240)
        if installed["exit_code"] != 0:
            raise AssertionError(f"isolated cli package install failed: {installed}")
    return {
        "venv_path": ISOLATED_VENV.as_posix(),
        "python": python_exe.as_posix(),
        "created": created,
        "pip_install": installed,
        "packages": packages,
    }


def write_shim(tool: dict) -> dict:
    BIN_DIR.mkdir(parents=True, exist_ok=True)
    target = ISOLATED_VENV / "Scripts" / tool["target_exe"]
    if not target.exists():
        raise AssertionError(f"isolated target executable missing: {target}")
    shim = BIN_DIR / tool["shim_name"]
    shim.write_text(f"@echo off\r\n\"%~dp0..\\venvs\\openvas-zap-cli\\Scripts\\{tool['target_exe']}\" %*\r\n", encoding="ascii", newline="")
    return {
        "shim_path": shim.as_posix(),
        "shim_sha256": sha256_file(shim),
        "target_exe": target.as_posix(),
        "target_sha256": sha256_file(target),
    }


def pin_wrapper(client: TestClient, tool: dict, shim: dict, probe: dict) -> tuple[dict, dict]:
    version_text = (probe.get("stdout_excerpt") or probe.get("stderr_excerpt") or "")[:1000]
    request = client.post(
        f"/api/redteam/v2/tool-wrapper-pins/{tool['tool_id']}/request",
        json={
            "case_id": CASE_ID,
            "requested_by": "analyst@example.com",
            "expected_sha256": shim["shim_sha256"],
            "operator_attested_version": version_text.splitlines()[0] if version_text.splitlines() else tool["tool_name"],
            "version_command": " ".join(tool["version_probe"]),
            "version_output_excerpt": version_text,
            "version_command_executed_by_operator": True,
        },
    ).json()
    approval = client.post(
        f"/api/redteam/v2/tool-wrapper-pins/{tool['tool_id']}/approve",
        headers={"X-RedTeam-Actor": "lead@example.com", "X-RedTeam-Actor-Role": "red_team_lead"},
        json={
            "case_id": CASE_ID,
            "pin_request_id": request.get("pin_request_id"),
            "approver": "lead@example.com",
            "approver_role": "red_team_lead",
            "decision": "approve",
        },
    ).json()
    return request, approval


def governed_run(client: TestClient, tool: dict) -> dict:
    action = client.post(
        "/api/redteam/v2/tool-actions/plan",
        json={
            "case_id": CASE_ID,
            "action_id": tool["action_id"],
            "title": f"{tool['tool_name']} wrapper live smoke",
            "objective": f"Run {tool['tool_name']} low-risk CLI metadata command through governed RedTeam AX runner.",
            "tool_id": tool["tool_id"],
            "risk_class": "T0",
            "requested_by": "analyst@example.com",
            "target_scope_refs": ["SCOPE-APPROVED-LOCAL-LAB"],
        },
    ).json()
    plan = client.post(
        f"/api/redteam/v2/tool-actions/{tool['action_id']}/execution-plan",
        json={
            "case_id": CASE_ID,
            "tool_id": tool["tool_id"],
            "execution_mode": "dry_run",
            "requested_by": "analyst@example.com",
            "max_runtime_seconds": 30,
            "max_output_bytes": 8192,
        },
    ).json()
    run_body = client.post(
        f"/api/redteam/v2/tool-actions/{tool['action_id']}/execute-governed",
        json={
            "case_id": CASE_ID,
            "tool_id": tool["tool_id"],
            "execution_mode": "dry_run",
            "requested_by": "analyst@example.com",
            "execution_plan_id": plan.get("execution_plan_id"),
            "execution_token_id": (plan.get("execution_token") or {}).get("token_id"),
            "runner_argv": tool["runner_argv"],
            "max_runtime_seconds": 30,
            "max_output_bytes": 8192,
        },
    ).json()
    sanitizer: dict = {}
    normalized: dict = {}
    evidence: dict = {}
    if run_body.get("status") == "RunnerExecuted":
        sanitizer = client.post(f"/api/redteam/v2/tool-runs/{run_body['run_id']}/sanitize-preview", json={"case_id": CASE_ID}).json()
        normalized = client.post(
            f"/api/redteam/v2/tool-runs/{run_body['run_id']}/agent-analyze",
            json={
                "case_id": CASE_ID,
                "summary": f"{tool['tool_name']} CLI metadata output captured by governed runner.",
                "result_type": "scanner_cli_runtime_evidence",
            },
        ).json()
        if normalized.get("status") == "Normalized":
            evidence = client.post(
                f"/api/redteam/v2/tool-runs/{run_body['run_id']}/create-evidence",
                json={
                    "case_id": CASE_ID,
                    "result_id": normalized["result_id"],
                    "summary": f"{tool['tool_name']} governed wrapper live smoke output evidence candidate.",
                },
            ).json()
    return {
        "action": {"status": action.get("status"), "action_id": action.get("action_id")},
        "plan": {
            "status": plan.get("status"),
            "execution_plan_id": plan.get("execution_plan_id"),
            "token_status": (plan.get("execution_token") or {}).get("status"),
            "pinning_status": (plan.get("wrapper_manifest") or {}).get("pinning_status"),
            "errors": plan.get("errors") or [],
            "warnings": plan.get("warnings") or [],
        },
        "run": {
            "status": run_body.get("status"),
            "run_id": run_body.get("run_id"),
            "runner_status": (run_body.get("runner_attempt") or {}).get("status"),
            "exit_code": (run_body.get("runner_attempt") or {}).get("exit_code"),
            "artifact_path": run_body.get("artifact_path"),
            "raw_artifact_count": len(run_body.get("raw_artifacts") or []),
            "errors": run_body.get("errors") or [],
        },
        "sanitize_preview": {
            "status": sanitizer.get("status"),
            "trusted_as_instruction": sanitizer.get("trusted_as_instruction"),
        },
        "agent_analyze": {
            "status": normalized.get("status"),
            "result_id": normalized.get("result_id"),
            "artifact_path": normalized.get("artifact_path"),
        },
        "evidence": {
            "status": evidence.get("status"),
            "evidence_id": evidence.get("evidence_id"),
            "artifact_path": evidence.get("artifact_path"),
        },
    }


def main() -> int:
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    bootstrap = ensure_isolated_venv()
    original_path = os.environ.get("PATH", "")
    os.environ["PATH"] = str(BIN_DIR) + os.pathsep + original_path
    from runtime import malware_upload_api

    client = TestClient(malware_upload_api.app)
    result = {
        "kind": "redteam_ax_openvas_zap_cli_live_smoke",
        "created_at": now_utc(),
        "case_id": CASE_ID,
        "status": "running",
        "safe_by_default": True,
        "commands_executed_by_api": True,
        "shell_expansion_allowed": False,
        "trusted_as_instruction": False,
        "requires_human_validation": True,
        "bootstrap": bootstrap,
        "tools": [],
        "residual_blockers": [
            {
                "tool_id": "TOOL-OPENVAS-001",
                "status": "service_endpoint_not_configured",
                "reason": "This smoke proves the read-only gvm-cli wrapper path, not a live authenticated OpenVAS service report import.",
            },
            {
                "tool_id": "TOOL-ZAP-001",
                "status": "zap_daemon_not_started",
                "reason": "This smoke proves the ZAP CLI wrapper metadata path, not a live ZAP daemon passive-alert import.",
            },
        ],
        "errors": [],
    }
    for tool in TOOLS:
        tool_result = {"tool_id": tool["tool_id"], "tool_name": tool["tool_name"], "status": "running"}
        try:
            shim = write_shim(tool)
            probe = run(tool["version_probe"], timeout=30)
            pin_request, pin_approval = pin_wrapper(client, tool, shim, probe)
            governed = governed_run(client, tool)
            tool_result.update(
                {
                    "status": "passed" if governed["run"]["status"] == "RunnerExecuted" and governed["evidence"]["status"] != "invalid" else "failed",
                    "shim": shim,
                    "host_probe": probe,
                    "pin_request": {
                        "status": pin_request.get("status"),
                        "pin_request_id": pin_request.get("pin_request_id"),
                        "errors": pin_request.get("errors") or [],
                    },
                    "pin_approval": {
                        "status": pin_approval.get("status"),
                        "approval_id": pin_approval.get("approval_id"),
                        "errors": pin_approval.get("errors") or [],
                    },
                    "governed": governed,
                }
            )
        except Exception as exc:
            tool_result.update({"status": "failed", "error": str(exc)})
            result["errors"].append({"tool_id": tool["tool_id"], "error": str(exc)})
        result["tools"].append(tool_result)
    failed = [tool for tool in result["tools"] if tool.get("status") != "passed"]
    result["status"] = "passed" if not failed else "failed"
    ARTIFACT_PATH.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8", newline="\n")
    print(
        json.dumps(
            {
                "status": result["status"],
                "artifact_path": ARTIFACT_PATH.as_posix(),
                "passed_tools": [tool["tool_id"] for tool in result["tools"] if tool.get("status") == "passed"],
                "failed_tools": [tool["tool_id"] for tool in failed],
                "residual_blockers": [item["status"] for item in result["residual_blockers"]],
            },
            ensure_ascii=False,
        )
    )
    return 0 if result["status"] == "passed" else 1


if __name__ == "__main__":
    raise SystemExit(main())
