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


def distro_probe_order(distros: list[dict[str, str]], requested: str | None) -> list[str]:
    if requested:
        return [requested]
    ordered: list[str] = []
    default = next((item["name"] for item in distros if item.get("default") == "true"), None)
    if default:
        ordered.append(default)
    running = [
        item["name"]
        for item in distros
        if item.get("state", "").lower() == "running" and item["name"] not in ordered
    ]
    stopped = [
        item["name"]
        for item in distros
        if item.get("state", "").lower() != "running" and item["name"] not in ordered
    ]
    ordered.extend(running)
    ordered.extend(stopped)
    internal = [name for name in ordered if name.lower() == "docker-desktop"]
    non_internal = [name for name in ordered if name.lower() != "docker-desktop"]
    return non_internal + internal


def classify_wsl_probe_failure(probe: dict[str, Any]) -> list[str]:
    text = normalize_wsl_text(f"{probe.get('stdout') or ''}\n{probe.get('stderr') or ''}").lower()
    blockers = ["wsl_distribution_start_failed"]
    if "0x80070570" in text:
        blockers.append("wsl_ext4_vhdx_corrupt_or_unreadable")
    if "error_path_not_found" in text or "path_not_found" in text:
        blockers.append("wsl_ext4_vhdx_path_not_found")
    if "mountdisk" in text:
        blockers.append("wsl_mount_disk_failed")
    return blockers


def parse_available_tool_paths(stdout: str) -> list[str]:
    return [line.strip() for line in stdout.splitlines()[1:] if line.strip().startswith("/")]


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

    probe_order = distro_probe_order(distros, args.distro)
    result["probe_order"] = probe_order
    preferred = probe_order[0]
    result["selected_distro"] = preferred
    if not args.allow_start:
        result.update({
            "status": "wsl_listed_start_not_requested",
            "blockers": ["use_--allow-start_to_probe_selected_wsl_distribution"],
        })
        return result, 2 if args.require_ready else 0

    command = "uname -a; command -v node || true; command -v npm || true; command -v trivy || true; command -v nuclei || true; command -v docker || true; command -v podman || true"
    probe_results: list[dict[str, Any]] = []
    result["wsl_command_executed"] = True
    for candidate in probe_order:
        probe = run_command([wsl_path, "-d", candidate, "--", "sh", "-lc", command], timeout=args.timeout)
        normalized_probe = {
            **probe,
            "distro": candidate,
            "stdout": normalize_wsl_text(probe.get("stdout") or ""),
            "stderr": normalize_wsl_text(probe.get("stderr") or ""),
        }
        available = parse_available_tool_paths(normalized_probe.get("stdout") or "")
        normalized_probe["available_tool_paths"] = available
        normalized_probe["blockers"] = [] if probe.get("exit_code") == 0 else classify_wsl_probe_failure(normalized_probe)
        probe_results.append(normalized_probe)
        if probe.get("exit_code") == 0 and available:
            result["selected_distro"] = candidate
            result["selected_distro_reason"] = "first_probe_with_relevant_tool_paths"
            result["wsl_tool_probe"] = normalized_probe
            result["wsl_tool_probe_results"] = probe_results
            result["available_tool_paths"] = available
            result["status"] = "ready"
            result["blockers"] = []
            result["failed_probe_count_before_selection"] = len(probe_results) - 1
            return result, 0

    result["wsl_tool_probe_results"] = probe_results
    result["wsl_tool_probe"] = probe_results[0] if probe_results else {}
    failed_blockers = sorted({blocker for item in probe_results for blocker in item.get("blockers", [])})
    if any(item.get("exit_code") == 0 for item in probe_results):
        result.update({
            "status": "wsl_ready_tools_missing",
            "blockers": ["wsl_ready_but_required_tools_not_found"],
        })
        return result, 2 if args.require_ready else 0

    result.update({
        "status": "blocked_wsl_distribution_start_failed",
        "blockers": failed_blockers or ["wsl_distribution_start_failed"],
    })
    return result, 2 if args.require_ready else 0


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
