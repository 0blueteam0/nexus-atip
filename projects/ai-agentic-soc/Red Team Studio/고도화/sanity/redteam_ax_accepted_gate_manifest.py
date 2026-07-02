from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[3]
REDTEAM_ROOT = Path(__file__).resolve().parents[2]
FRONTEND_ROOT = PROJECT_ROOT / "soc-frontend-vite-react" / "soc-frontend" / "idiomatic-react"
ARTIFACT_DIR = PROJECT_ROOT / "archive" / "runs" / "redteam-ax-v2-accepted-gates"
LATEST_ARTIFACT = ARTIFACT_DIR / "latest_accepted_gate_manifest.json"
AUDIT_MATRIX = REDTEAM_ROOT / "고도화" / "completion-audit" / "redteam_ax_completion_audit_matrix.json"
INSTALLED_TOOL_SMOKE = PROJECT_ROOT / "archive" / "runs" / "redteam-ax-v2-installed-tool-live-smoke" / "latest_installed_tool_live_smoke.json"


def now_utc() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def excerpt(text: str, limit: int = 12000) -> str:
    if len(text) <= limit:
        return text
    head = text[: limit // 2]
    tail = text[-(limit // 2) :]
    return f"{head}\n...<truncated {len(text) - limit} chars>...\n{tail}"


def run_gate(gate: dict) -> dict:
    started = time.monotonic()
    started_at = now_utc()
    command = gate["command"]
    cwd = Path(gate["cwd"])
    result = {
        "gate_id": gate["gate_id"],
        "name": gate["name"],
        "category": gate["category"],
        "command": command,
        "cwd": cwd.as_posix(),
        "timeout_seconds": gate["timeout_seconds"],
        "started_at": started_at,
        "status": "running",
    }
    try:
        completed = subprocess.run(
            command,
            cwd=cwd,
            shell=False,
            text=True,
            encoding="utf-8",
            errors="replace",
            capture_output=True,
            timeout=gate["timeout_seconds"],
        )
        result.update(
            {
                "completed_at": now_utc(),
                "duration_seconds": round(time.monotonic() - started, 3),
                "exit_code": completed.returncode,
                "status": "passed" if completed.returncode == 0 else "failed",
                "stdout_excerpt": excerpt(completed.stdout),
                "stderr_excerpt": excerpt(completed.stderr),
            }
        )
    except subprocess.TimeoutExpired as exc:
        result.update(
            {
                "completed_at": now_utc(),
                "duration_seconds": round(time.monotonic() - started, 3),
                "exit_code": None,
                "status": "timeout",
                "stdout_excerpt": excerpt(exc.stdout or ""),
                "stderr_excerpt": excerpt(exc.stderr or ""),
            }
        )
    return result


def load_json(path: Path) -> dict:
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def accepted_gates() -> list[dict]:
    py = sys.executable
    return [
        {
            "gate_id": "GATE-API-REGRESSION",
            "name": "RedTeam AX v2 API regression",
            "category": "api_regression",
            "cwd": PROJECT_ROOT,
            "command": [py, "-m", "pytest", "tests/test_redteam_v2_api_router.py", "-q"],
            "timeout_seconds": 180,
        },
        {
            "gate_id": "GATE-SAMPLE-E2E",
            "name": "RedTeam AX v2 sample case E2E and report gate",
            "category": "sample_e2e_report_verification",
            "cwd": PROJECT_ROOT,
            "command": [py, "-m", "pytest", "tests/test_redteam_v2_sample_e2e.py", "-q"],
            "timeout_seconds": 180,
        },
        {
            "gate_id": "GATE-COMPLETION-AUDIT",
            "name": "Completion audit matrix sanity",
            "category": "completion_audit",
            "cwd": REDTEAM_ROOT,
            "command": [py, "고도화/sanity/test_completion_audit_matrix.py"],
            "timeout_seconds": 60,
        },
        {
            "gate_id": "GATE-PLAN-CONTRACT",
            "name": "FINAL_PLAN and Detailed_PLAN contract sanity",
            "category": "plan_contract",
            "cwd": REDTEAM_ROOT,
            "command": [py, "고도화/sanity/test_plan_contract.py"],
            "timeout_seconds": 60,
        },
        {
            "gate_id": "GATE-KOREAN-COPY",
            "name": "RedTeam2 Korean beginner-facing copy inventory",
            "category": "frontend_korean_copy",
            "cwd": REDTEAM_ROOT,
            "command": [py, "고도화/sanity/test_redteam2_korean_copy_inventory.py"],
            "timeout_seconds": 60,
        },
        {
            "gate_id": "GATE-INSTALLED-TOOL-LIVE-SMOKE",
            "name": "Governed installed npm audit runner live smoke",
            "category": "installed_tool_runtime_smoke",
            "cwd": REDTEAM_ROOT,
            "command": [py, "고도화/sanity/redteam_ax_installed_tool_live_smoke.py"],
            "timeout_seconds": 120,
        },
        {
            "gate_id": "GATE-PY-COMPILE",
            "name": "Python compile check for changed RedTeam AX runtime and sanity modules",
            "category": "static_compile",
            "cwd": PROJECT_ROOT,
            "command": [
                py,
                "-m",
                "py_compile",
                "runtime/redteam_v2_models.py",
                "runtime/redteam_v2_api_router.py",
                "Red Team Studio/고도화/sanity/redteam_ax_accepted_gate_manifest.py",
                "Red Team Studio/고도화/sanity/redteam_ax_installed_tool_live_smoke.py",
            ],
            "timeout_seconds": 60,
        },
        {
            "gate_id": "GATE-FRONTEND-JS-CHECK",
            "name": "Report Studio frontend JavaScript syntax check",
            "category": "frontend_static_check",
            "cwd": PROJECT_ROOT,
            "command": ["node", "--check", "soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js"],
            "timeout_seconds": 60,
        },
        {
            "gate_id": "GATE-FRONTEND-BUILD",
            "name": "Report Studio frontend production build",
            "category": "frontend_build",
            "cwd": FRONTEND_ROOT,
            "command": ["npm.cmd", "run", "build"],
            "timeout_seconds": 240,
        },
    ]


def build_manifest(gate_results: list[dict]) -> dict:
    audit_matrix = load_json(AUDIT_MATRIX)
    installed_smoke = load_json(INSTALLED_TOOL_SMOKE)
    failed = [gate for gate in gate_results if gate["status"] != "passed"]
    zero_gate_source = "tests/test_redteam_v2_sample_e2e.py"
    return {
        "kind": "redteam_ax_accepted_gate_manifest",
        "schema_version": "0.1",
        "created_at": now_utc(),
        "status": "passed" if not failed else "failed",
        "project_root": PROJECT_ROOT.as_posix(),
        "redteam_root": REDTEAM_ROOT.as_posix(),
        "accepted_gate_count": len(gate_results),
        "passed_gate_count": len(gate_results) - len(failed),
        "failed_gate_count": len(failed),
        "zero_count_gate": {
            "source": zero_gate_source,
            "asserts_unsupported_claim_count_zero": True,
            "asserts_unapproved_high_risk_count_zero": True,
            "asserts_finding_without_evidence_count_zero": True,
            "covered_by_gate_id": "GATE-SAMPLE-E2E",
        },
        "completion_audit_snapshot": {
            "goal_status": audit_matrix.get("goal_status"),
            "status_counts": audit_matrix.get("status_counts"),
            "remaining_gaps": audit_matrix.get("remaining_gaps"),
        },
        "installed_tool_smoke_snapshot": {
            "artifact_path": INSTALLED_TOOL_SMOKE.as_posix(),
            "status": installed_smoke.get("status"),
            "tool_name": installed_smoke.get("tool_name"),
            "run_id": installed_smoke.get("run_id"),
            "evidence_id": installed_smoke.get("evidence_id"),
        },
        "gates": gate_results,
    }


def write_manifest(manifest: dict) -> Path:
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    timestamped = ARTIFACT_DIR / f"accepted_gate_manifest_{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}.json"
    manifest["artifact_path"] = LATEST_ARTIFACT.as_posix()
    manifest["timestamped_artifact_path"] = timestamped.as_posix()
    payload = json.dumps(manifest, ensure_ascii=False, indent=2)
    LATEST_ARTIFACT.write_text(payload, encoding="utf-8")
    timestamped.write_text(payload, encoding="utf-8")
    return LATEST_ARTIFACT


def main() -> int:
    parser = argparse.ArgumentParser(description="Run RedTeam AX accepted verification gates and write a manifest artifact.")
    parser.add_argument("--list", action="store_true", help="Print accepted gates without executing them.")
    args = parser.parse_args()

    gates = accepted_gates()
    if args.list:
        serializable_gates = [{**gate, "cwd": Path(gate["cwd"]).as_posix()} for gate in gates]
        print(json.dumps({"accepted_gates": serializable_gates}, ensure_ascii=False, indent=2))
        return 0

    results = [run_gate(gate) for gate in gates]
    manifest = build_manifest(results)
    artifact_path = write_manifest(manifest)
    print(
        json.dumps(
            {
                "status": manifest["status"],
                "artifact_path": artifact_path.as_posix(),
                "accepted_gate_count": manifest["accepted_gate_count"],
                "passed_gate_count": manifest["passed_gate_count"],
                "failed_gate_count": manifest["failed_gate_count"],
            },
            ensure_ascii=False,
        )
    )
    return 0 if manifest["status"] == "passed" else 1


if __name__ == "__main__":
    raise SystemExit(main())
