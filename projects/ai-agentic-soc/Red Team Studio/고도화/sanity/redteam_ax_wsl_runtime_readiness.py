from __future__ import annotations

import argparse
import json
import shutil
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[3]
ARTIFACT_DIR = PROJECT_ROOT / "archive" / "runs" / "redteam-ax-v2-wsl-runtime-readiness"
ARTIFACT_PATH = ARTIFACT_DIR / "latest_wsl_runtime_readiness.json"


def now_utc() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def run_command(argv: list[str], timeout: int = 20) -> dict[str, Any]:
    try:
        completed = subprocess.run(
            argv,
            cwd=PROJECT_ROOT,
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


def normalize_wsl_text(text: str) -> str:
    return text.replace("\x00", "")


def parse_wsl_list(output: str) -> list[dict[str, str]]:
    normalized = normalize_wsl_text(output)
    distros: list[dict[str, str]] = []
    for raw_line in normalized.splitlines():
        line = raw_line.strip()
        if not line or line.upper().startswith("NAME"):
            continue
        default = line.startswith("*")
        if default:
            line = line[1:].strip()
        parts = line.split()
        if len(parts) >= 3:
            distros.append({
                "name": " ".join(parts[:-2]),
                "state": parts[-2],
                "version": parts[-1],
                "default": str(default).lower(),
            })
    return distros


def build_readiness(args: argparse.Namespace) -> tuple[dict[str, Any], int]:
    wsl_path = shutil.which("wsl.exe") or shutil.which("wsl")
    result: dict[str, Any] = {
        "kind": "redteam_ax_wsl_runtime_readiness",
        "created_at": now_utc(),
        "safe_by_default": True,
        "wsl_command_executed": False,
        "tool_commands_executed": False,
        "active_scan_executed": False,
        "trusted_as_instruction": False,
        "requires_human_validation": True,
        "allow_start": bool(args.allow_start),
        "wsl_path": wsl_path,
    }
    if not wsl_path:
        result.update({
            "status": "blocked_wsl_executable_not_found",
            "blockers": ["wsl_executable_not_found"],
            "distros": [],
        })
        return result, 2 if args.require_ready else 0

    list_probe = run_command([wsl_path, "-l", "-v"], timeout=args.timeout)
    result["wsl_list_probe"] = {
        **list_probe,
        "stdout": normalize_wsl_text(list_probe.get("stdout") or ""),
        "stderr": normalize_wsl_text(list_probe.get("stderr") or ""),
    }
    distros = parse_wsl_list(result["wsl_list_probe"].get("stdout") or "")
    result["distros"] = distros
    if list_probe.get("exit_code") != 0:
        result.update({
            "status": "blocked_wsl_list_failed",
            "blockers": ["wsl_list_failed"],
        })
        return result, 2 if args.require_ready else 0
    if not distros:
        result.update({
            "status": "blocked_wsl_distribution_not_found",
            "blockers": ["wsl_distribution_not_found"],
        })
        return result, 2 if args.require_ready else 0

    preferred = args.distro or next((item["name"] for item in distros if item.get("default") == "true"), distros[0]["name"])
    result["selected_distro"] = preferred
    if not args.allow_start:
        result.update({
            "status": "wsl_listed_start_not_requested",
            "blockers": ["use_--allow-start_to_probe_selected_wsl_distribution"],
        })
        return result, 2 if args.require_ready else 0

    command = "uname -a; command -v node || true; command -v npm || true; command -v trivy || true; command -v nuclei || true; command -v docker || true; command -v podman || true"
    probe = run_command([wsl_path, "-d", preferred, "--", "sh", "-lc", command], timeout=args.timeout)
    result["wsl_command_executed"] = True
    result["wsl_tool_probe"] = {
        **probe,
        "stdout": normalize_wsl_text(probe.get("stdout") or ""),
        "stderr": normalize_wsl_text(probe.get("stderr") or ""),
    }
    if probe.get("exit_code") != 0:
        result.update({
            "status": "blocked_wsl_distribution_start_failed",
            "blockers": ["wsl_distribution_start_failed"],
        })
        return result, 2 if args.require_ready else 0

    stdout = result["wsl_tool_probe"].get("stdout") or ""
    available = [line.strip() for line in stdout.splitlines()[1:] if line.strip().startswith("/")]
    result["available_tool_paths"] = available
    result["status"] = "ready" if available else "wsl_ready_tools_missing"
    result["blockers"] = [] if available else ["wsl_ready_but_required_tools_not_found"]
    return result, 0 if result["status"] == "ready" else (2 if args.require_ready else 0)


def main() -> int:
    parser = argparse.ArgumentParser(description="RedTeam AX WSL runtime readiness checker.")
    parser.add_argument("--allow-start", action="store_true", help="Start the selected WSL distro for a low-risk tool path probe.")
    parser.add_argument("--require-ready", action="store_true", help="Return non-zero unless WSL and at least one relevant tool path are ready.")
    parser.add_argument("--distro", default=None, help="WSL distro name to probe when --allow-start is set.")
    parser.add_argument("--timeout", type=int, default=20)
    args = parser.parse_args()
    result, exit_code = build_readiness(args)
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    ARTIFACT_PATH.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8", newline="\n")
    print(json.dumps({
        "status": result["status"],
        "artifact_path": ARTIFACT_PATH.as_posix(),
        "selected_distro": result.get("selected_distro"),
        "blockers": result.get("blockers", []),
    }, ensure_ascii=False))
    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())
