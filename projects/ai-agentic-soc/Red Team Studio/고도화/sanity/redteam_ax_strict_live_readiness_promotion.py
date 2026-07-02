from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[3]
REDTEAM_ROOT = Path(__file__).resolve().parents[2]
ARTIFACT_DIR = PROJECT_ROOT / "archive" / "runs" / "redteam-ax-v2-strict-live-readiness-promotion"
ARTIFACT_PATH = ARTIFACT_DIR / "latest_strict_live_readiness_promotion.json"


def now_utc() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def run_command(argv: list[str], timeout: int) -> dict[str, Any]:
    try:
        completed = subprocess.run(
            argv,
            cwd=REDTEAM_ROOT,
            capture_output=True,
            text=True,
            encoding="utf-8",
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


def parse_stdout_json(stdout: str) -> dict[str, Any]:
    lines = [line.strip() for line in (stdout or "").splitlines() if line.strip()]
    for line in reversed(lines):
        if not line.startswith("{"):
            continue
        try:
            parsed = json.loads(line)
        except json.JSONDecodeError:
            continue
        if isinstance(parsed, dict):
            return parsed
    return {}


def gate_command(gate_id: str, script_name: str, args: list[str], timeout: int) -> dict[str, Any]:
    argv = [sys.executable, str(REDTEAM_ROOT / "고도화" / "sanity" / script_name), *args]
    result = run_command(argv, timeout=timeout)
    summary = parse_stdout_json(result.get("stdout") or "")
    blockers = summary.get("blockers")
    if isinstance(blockers, dict):
        blocker_items = [f"{name}:{','.join(values or [])}" for name, values in blockers.items()]
    elif isinstance(blockers, list):
        blocker_items = [str(item) for item in blockers]
    else:
        blocker_items = []
    return {
        "gate_id": gate_id,
        "script": script_name,
        "argv": argv,
        "exit_code": result.get("exit_code"),
        "status": summary.get("status") or ("passed" if result.get("exit_code") == 0 else "failed"),
        "artifact_path": summary.get("artifact_path"),
        "blockers": blocker_items,
        "stdout_excerpt": result.get("stdout", "")[:4000],
        "stderr_excerpt": result.get("stderr", "")[:4000],
        "timeout": bool(result.get("timeout")),
    }


def build_promotion(args: argparse.Namespace) -> tuple[dict[str, Any], int]:
    container_args = ["--require-real"]
    if args.allow_container:
        container_args.insert(0, "--allow-real")

    external_args = ["--require-ready"]
    service_import_args = ["--require-ready"]
    if args.allow_network:
        external_args.insert(0, "--allow-network")
        service_import_args.insert(0, "--allow-network")

    gate_results = [
        gate_command(
            "PROMOTE-CONTAINER-RUNTIME-REAL",
            "redteam_ax_container_runtime_smoke.py",
            container_args,
            args.timeout,
        ),
        gate_command(
            "PROMOTE-WSL-RUNTIME-READY",
            "redteam_ax_wsl_runtime_readiness.py",
            ["--allow-start", "--require-ready"],
            args.timeout,
        ),
        gate_command(
            "PROMOTE-EXTERNAL-SCANNER-READINESS",
            "redteam_ax_external_scanner_service_readiness.py",
            external_args,
            args.timeout,
        ),
        gate_command(
            "PROMOTE-EXTERNAL-SCANNER-IMPORT-LIVE",
            "redteam_ax_external_scanner_service_import_live_smoke.py",
            service_import_args,
            args.timeout,
        ),
    ]
    failed = [item for item in gate_results if item["exit_code"] != 0]
    blockers = [
        f"{item['gate_id']}:{','.join(item['blockers']) or item['status']}"
        for item in failed
    ]
    status = "promotion_ready" if not failed else "blocked_strict_live_readiness_promotion"
    result = {
        "kind": "redteam_ax_strict_live_readiness_promotion",
        "created_at": now_utc(),
        "status": status,
        "safe_by_default": True,
        "allow_container": bool(args.allow_container),
        "allow_network": bool(args.allow_network),
        "commands_executed_by_api": False,
        "active_scan_executed": False,
        "trusted_as_instruction": False,
        "requires_human_validation": True,
        "promotion_gate_count": len(gate_results),
        "passed_gate_count": len(gate_results) - len(failed),
        "failed_gate_count": len(failed),
        "gate_results": gate_results,
        "blockers": blockers,
        "operator_next_steps": [
            "Run with --allow-container only after Docker daemon, pinned local image digest, and container runtime attestations are ready.",
            "Run with --allow-network only after ROE approves read-only organization OpenVAS/ZAP endpoint checks.",
            "Use --require-promotion in controlled release validation so any strict live readiness blocker returns non-zero.",
        ],
    }
    exit_code = 0
    if args.require_promotion and status != "promotion_ready":
        exit_code = 2
    return result, exit_code


def main() -> int:
    parser = argparse.ArgumentParser(description="RedTeam AX strict live readiness promotion gate.")
    parser.add_argument("--allow-container", action="store_true", help="Permit the strict gate to opt in to real container smoke.")
    parser.add_argument("--allow-network", action="store_true", help="Permit approved read-only external scanner endpoint checks/imports.")
    parser.add_argument("--require-promotion", action="store_true", help="Return non-zero unless every strict live readiness gate passes.")
    parser.add_argument("--timeout", type=int, default=60)
    args = parser.parse_args()
    result, exit_code = build_promotion(args)
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    ARTIFACT_PATH.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8", newline="\n")
    print(json.dumps({
        "status": result["status"],
        "artifact_path": ARTIFACT_PATH.as_posix(),
        "passed_gate_count": result["passed_gate_count"],
        "failed_gate_count": result["failed_gate_count"],
        "blockers": result["blockers"],
    }, ensure_ascii=False))
    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())
