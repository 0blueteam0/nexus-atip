from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[3]
ARTIFACT_DIR = PROJECT_ROOT / "archive" / "runs" / "redteam-ax-v2-runtime-smoke"
ARTIFACT_PATH = ARTIFACT_DIR / "latest_container_runtime_smoke.json"


def now_utc() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def run_command(argv: list[str], timeout: int = 30) -> dict[str, Any]:
    try:
        completed = subprocess.run(
            argv,
            cwd=str(PROJECT_ROOT),
            capture_output=True,
            text=True,
            errors="replace",
            timeout=timeout,
            shell=False,
        )
        return {
            "argv": argv,
            "exit_code": completed.returncode,
            "stdout": (completed.stdout or "")[:12000],
            "stderr": (completed.stderr or "")[:12000],
        }
    except FileNotFoundError as exc:
        return {"argv": argv, "exit_code": 127, "stdout": "", "stderr": str(exc)}
    except subprocess.TimeoutExpired as exc:
        return {
            "argv": argv,
            "exit_code": None,
            "stdout": str(exc.stdout or "")[:12000],
            "stderr": str(exc.stderr or "")[:12000],
            "timeout": True,
        }


def docker_preflight(runtime: str) -> dict[str, Any]:
    runtime_path = shutil.which(runtime)
    if not runtime_path:
        return {
            "runtime": runtime,
            "runtime_path": None,
            "ready": False,
            "blocker": "container_runtime_executable_not_found",
        }
    version = run_command([runtime_path, "version", "--format", "{{json .}}"], timeout=20)
    parsed: dict[str, Any] | None = None
    if version["exit_code"] == 0:
        try:
            parsed = json.loads(version.get("stdout") or "{}")
        except json.JSONDecodeError:
            parsed = None
    server_ready = bool(parsed and parsed.get("Server"))
    blocker = None if server_ready else "docker_daemon_unavailable_or_not_started"
    return {
        "runtime": runtime,
        "runtime_path": runtime_path,
        "ready": server_ready,
        "blocker": blocker,
        "version_probe": version,
    }


def local_repo_digest(runtime_path: str, image: str) -> tuple[str | None, dict[str, Any]]:
    inspect = run_command([runtime_path, "image", "inspect", image], timeout=30)
    if inspect["exit_code"] != 0:
        return None, inspect
    try:
        payload = json.loads(inspect.get("stdout") or "[]")
    except json.JSONDecodeError:
        return None, inspect
    if not payload:
        return None, inspect
    repo_digests = payload[0].get("RepoDigests") or []
    if repo_digests:
        return str(repo_digests[0]), inspect
    if "@sha256:" in image:
        return image, inspect
    return None, inspect


def real_container_api_smoke(image_digest: str, runner_argv: list[str], timeout: int) -> dict[str, Any]:
    sys.path.insert(0, str(PROJECT_ROOT))
    from fastapi.testclient import TestClient
    from runtime.malware_upload_api import app

    from unittest.mock import patch

    client = TestClient(app)
    case_id = "CASE-V2-CONTAINER-RUNTIME-SMOKE-001"
    action_id = "TAC-CONTAINER-RUNTIME-SMOKE-001"
    env = {
        "REDTEAM_AX_CONTAINER_RUNNER_ENABLED": "1",
        "REDTEAM_AX_CONTAINER_RUNTIME_ATTESTED": "1",
        "REDTEAM_AX_CONTAINER_NETWORK_ATTESTED": "1",
        "REDTEAM_AX_CONTAINER_MOUNT_ATTESTED": "1",
        "REDTEAM_AX_CONTAINER_CLEANUP_ATTESTED": "1",
        "REDTEAM_AX_CONTAINER_IMAGE_DIGEST": image_digest,
    }
    with patch.dict(os.environ, env, clear=False):
        planned = client.post("/api/redteam/v2/tool-actions/plan", json={
            "case_id": case_id,
            "action_id": action_id,
            "title": "Trivy real ephemeral container runtime smoke",
            "objective": "Execute an approved low-risk container runner smoke and capture stdout/stderr as untrusted evidence.",
            "tool_id": "TOOL-TRIVY-001",
            "requested_by": "analyst@example.com",
        })
        plan = client.post(f"/api/redteam/v2/tool-actions/{action_id}/execution-plan", json={
            "case_id": case_id,
            "tool_id": "TOOL-TRIVY-001",
            "execution_mode": "sandbox_execute",
            "runner_backend": "ephemeral_container",
            "requested_by": "analyst@example.com",
            "max_runtime_seconds": timeout,
        })
        plan_body = plan.json()
        execute = client.post(f"/api/redteam/v2/tool-actions/{action_id}/execute-governed", json={
            "case_id": case_id,
            "tool_id": "TOOL-TRIVY-001",
            "execution_mode": "sandbox_execute",
            "requested_by": "analyst@example.com",
            "execution_plan_id": plan_body.get("execution_plan_id"),
            "execution_token_id": (plan_body.get("execution_token") or {}).get("token_id"),
            "runner_argv": runner_argv,
            "container_dry_run": False,
            "max_runtime_seconds": timeout,
        })
    execute_body = execute.json()
    raw_artifacts = execute_body.get("raw_artifacts") or []
    stderr_artifacts = [item for item in raw_artifacts if str(item.get("summary") or "").endswith("stderr captured as untrusted tool output.")]
    stdout_artifacts = [item for item in raw_artifacts if str(item.get("summary") or "").endswith("stdout captured as untrusted tool output.")]
    return {
        "planned_status_code": planned.status_code,
        "plan_status_code": plan.status_code,
        "execute_status_code": execute.status_code,
        "plan_status": plan_body.get("status"),
        "execute_status": execute_body.get("status"),
        "runner_attempt_status": (execute_body.get("runner_attempt") or {}).get("status"),
        "runner_exit_code": (execute_body.get("runner_attempt") or {}).get("exit_code"),
        "raw_artifact_count": len(raw_artifacts),
        "stdout_artifact_count": len(stdout_artifacts),
        "stderr_artifact_count": len(stderr_artifacts),
        "errors": execute_body.get("errors") or [],
        "run_id": execute_body.get("run_id"),
    }


def build_smoke_result(args: argparse.Namespace) -> tuple[dict[str, Any], int]:
    allow_real = args.allow_real or os.environ.get("REDTEAM_AX_REAL_CONTAINER_SMOKE", "").lower() in {"1", "true", "yes"}
    runtime = args.runtime or os.environ.get("REDTEAM_AX_CONTAINER_RUNTIME") or "docker"
    result: dict[str, Any] = {
        "kind": "redteam_ax_v2_container_runtime_smoke",
        "created_at": now_utc(),
        "allow_real_execution": allow_real,
        "safe_by_default": True,
        "commands_executed_by_api": False,
        "trusted_as_instruction": False,
        "requires_human_validation": True,
    }
    preflight = docker_preflight(runtime)
    result["runtime_preflight"] = preflight
    if not preflight.get("ready"):
        result["status"] = "blocked_container_runtime_not_ready"
        result["blockers"] = [preflight.get("blocker") or "container_runtime_not_ready"]
        return result, 2 if args.require_real else 0
    if not allow_real:
        result["status"] = "preflight_ready_real_smoke_not_requested"
        result["blockers"] = ["real_container_smoke_requires_allow_real"]
        return result, 2 if args.require_real else 0
    image = args.image or os.environ.get("REDTEAM_AX_CONTAINER_SMOKE_IMAGE") or "aquasec/trivy:latest"
    image_digest, inspect = local_repo_digest(str(preflight["runtime_path"]), image)
    result["image_probe"] = {"image": image, "resolved_digest": image_digest, "inspect": inspect}
    if not image_digest:
        result["status"] = "blocked_container_image_digest_not_available_locally"
        result["blockers"] = ["local_digest_pinned_image_required_no_pull_attempted"]
        return result, 2 if args.require_real else 0
    runner_argv = args.runner_argv or ["trivy", "--version"]
    api_smoke = real_container_api_smoke(image_digest, runner_argv, args.timeout)
    result["commands_executed_by_api"] = True
    result["api_smoke"] = api_smoke
    result["status"] = "passed" if api_smoke.get("execute_status") == "RunnerExecuted" else "failed"
    result["blockers"] = [] if result["status"] == "passed" else api_smoke.get("errors", [])
    return result, 0 if result["status"] == "passed" else 1


def main() -> int:
    parser = argparse.ArgumentParser(description="RedTeam AX governed ephemeral container runtime smoke harness.")
    parser.add_argument("--allow-real", action="store_true", help="Opt in to a real Docker/Podman container run.")
    parser.add_argument("--require-real", action="store_true", help="Return non-zero when the real runtime smoke cannot run.")
    parser.add_argument("--runtime", default=None, help="Container runtime executable name. Defaults to REDTEAM_AX_CONTAINER_RUNTIME or docker.")
    parser.add_argument("--image", default=None, help="Local image ref to inspect and run. No pull is attempted.")
    parser.add_argument("--timeout", type=int, default=30)
    parser.add_argument("runner_argv", nargs="*", help="Tool argv inside the container. Defaults to trivy --version.")
    args = parser.parse_args()

    result, exit_code = build_smoke_result(args)
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    ARTIFACT_PATH.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8", newline="\n")
    print(json.dumps({
        "status": result["status"],
        "artifact_path": ARTIFACT_PATH.as_posix(),
        "blockers": result.get("blockers", []),
    }, ensure_ascii=False))
    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())
