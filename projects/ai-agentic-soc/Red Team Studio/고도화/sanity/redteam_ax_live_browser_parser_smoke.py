from __future__ import annotations

import argparse
import json
import os
import socket
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


PROJECT_ROOT = Path(__file__).resolve().parents[3]
FRONTEND_ROOT = PROJECT_ROOT / "soc-frontend-vite-react" / "soc-frontend" / "idiomatic-react"
ARTIFACT_DIR = PROJECT_ROOT / "archive" / "runs" / "redteam-ax-v2-browser-smoke"
ARTIFACT_PATH = ARTIFACT_DIR / "latest_live_browser_parser_smoke.json"


def now_utc() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def tcp_probe(host: str, port: int, timeout: float = 2.0) -> dict[str, Any]:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(timeout)
        try:
            sock.connect((host, port))
            return {"host": host, "port": port, "open": True, "error": None}
        except OSError as exc:
            return {"host": host, "port": port, "open": False, "error": str(exc)}


def http_probe(url: str, timeout: float = 4.0) -> dict[str, Any]:
    req = Request(url, headers={"User-Agent": "redteam-ax-live-browser-parser-smoke/1.0"})
    try:
        with urlopen(req, timeout=timeout) as res:
            body = res.read(4096).decode("utf-8", errors="replace")
            return {
                "url": url,
                "ok": 200 <= int(res.status) < 400,
                "status_code": int(res.status),
                "body_prefix": body[:500],
                "error": None,
            }
    except HTTPError as exc:
        return {"url": url, "ok": False, "status_code": exc.code, "body_prefix": "", "error": str(exc)}
    except (OSError, URLError) as exc:
        return {"url": url, "ok": False, "status_code": None, "body_prefix": "", "error": str(exc)}


def run_command(argv: list[str], cwd: Path, timeout: int = 60) -> dict[str, Any]:
    try:
        completed = subprocess.run(
            argv,
            cwd=str(cwd),
            capture_output=True,
            text=True,
            errors="replace",
            timeout=timeout,
            shell=False,
        )
        return {
            "argv": argv,
            "cwd": str(cwd),
            "exit_code": completed.returncode,
            "stdout": (completed.stdout or "")[:12000],
            "stderr": (completed.stderr or "")[:12000],
        }
    except FileNotFoundError as exc:
        return {"argv": argv, "cwd": str(cwd), "exit_code": 127, "stdout": "", "stderr": str(exc)}
    except subprocess.TimeoutExpired as exc:
        return {
            "argv": argv,
            "cwd": str(cwd),
            "exit_code": None,
            "stdout": str(exc.stdout or "")[:12000],
            "stderr": str(exc.stderr or "")[:12000],
            "timeout": True,
        }


def node_executable() -> str:
    if os.name == "nt":
        return "node.exe"
    return "node"


def playwright_browser_smoke(frontend_url: str, timeout: int) -> dict[str, Any]:
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    script_path = ARTIFACT_DIR / "live_browser_parser_probe.mjs"
    script_path.write_text(
        """
import { chromium } from 'playwright';

const url = process.argv[2];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
const result = { url, checks: {} };
try {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  result.title = await page.title();
  result.finalUrl = page.url();
  const bodyText = await page.locator('body').innerText({ timeout: 5000 }).catch(() => '');
  result.bodyPrefix = bodyText.slice(0, 2000);
  result.checks.reportStudio = bodyText.includes('보고서 스튜디오') || bodyText.includes('Report Studio');
  result.checks.redteamAnalysis = bodyText.includes('레드팀 분석');
  result.checks.redteamAnalysis2 = bodyText.includes('레드팀 분석2') || bodyText.includes('RedTeam AX v2');
  result.status = Object.values(result.checks).every(Boolean) ? 'passed' : 'failed_dom_expectation';
} catch (error) {
  result.status = 'failed_browser_probe';
  result.error = String(error && error.stack ? error.stack : error);
} finally {
  await browser.close();
}
console.log(JSON.stringify(result));
""".strip(),
        encoding="utf-8",
        newline="\n",
    )
    probe = run_command([node_executable(), str(script_path), frontend_url], cwd=FRONTEND_ROOT, timeout=timeout)
    parsed: dict[str, Any] | None = None
    if probe.get("stdout"):
        try:
            parsed = json.loads(probe["stdout"])
        except json.JSONDecodeError:
            parsed = None
    return {
        "script_path": str(script_path),
        "command": probe,
        "result": parsed,
        "status": parsed.get("status") if parsed else "failed_unparseable_browser_result",
    }


def build_smoke_result(args: argparse.Namespace) -> tuple[dict[str, Any], int]:
    allow_browser = args.allow_browser or os.environ.get("REDTEAM_AX_LIVE_BROWSER_SMOKE", "").lower() in {
        "1",
        "true",
        "yes",
    }
    frontend_url = args.frontend_url.rstrip("/")
    backend_url = args.backend_url.rstrip("/")
    result: dict[str, Any] = {
        "kind": "redteam_ax_v2_live_browser_parser_smoke",
        "created_at": now_utc(),
        "frontend_url": frontend_url,
        "backend_url": backend_url,
        "allow_browser_automation": allow_browser,
        "safe_by_default": True,
        "commands_executed_by_api": False,
        "browser_automation_executed": False,
        "trusted_as_instruction": False,
        "requires_human_validation": True,
        "frontend_root": str(FRONTEND_ROOT),
    }
    result["readiness"] = {
        "frontend_tcp": tcp_probe("127.0.0.1", args.frontend_port),
        "backend_tcp": tcp_probe("127.0.0.1", args.backend_port),
        "frontend_http": http_probe(frontend_url + "/"),
        "backend_v2_health": http_probe(backend_url + "/api/redteam/v2/health"),
        "backend_v1_health": http_probe(backend_url + "/api/redteam/health"),
    }
    frontend_ready = bool(result["readiness"]["frontend_tcp"]["open"] and result["readiness"]["frontend_http"]["ok"])
    backend_ready = bool(
        result["readiness"]["backend_tcp"]["open"]
        and (result["readiness"]["backend_v2_health"]["ok"] or result["readiness"]["backend_v1_health"]["ok"])
    )
    blockers: list[str] = []
    if not frontend_ready:
        blockers.append("live_frontend_5177_not_ready")
    if not backend_ready:
        blockers.append("live_backend_8765_health_not_ready")
    if blockers:
        result["status"] = "blocked_live_services_not_ready"
        result["blockers"] = blockers
        return result, 2 if args.require_live else 0
    if not allow_browser:
        result["status"] = "preflight_ready_browser_smoke_not_requested"
        result["blockers"] = ["browser_smoke_requires_allow_browser"]
        return result, 2 if args.require_live else 0
    if not (FRONTEND_ROOT / "node_modules" / "playwright").exists():
        result["status"] = "blocked_playwright_dependency_not_installed"
        result["blockers"] = ["frontend_node_modules_playwright_not_found"]
        return result, 2 if args.require_live else 0
    result["browser_automation_executed"] = True
    browser = playwright_browser_smoke(frontend_url + "/", args.timeout)
    result["browser_smoke"] = browser
    result["status"] = "passed" if browser.get("status") == "passed" else "failed_browser_dom_parser_smoke"
    result["blockers"] = [] if result["status"] == "passed" else [browser.get("status") or "browser_smoke_failed"]
    return result, 0 if result["status"] == "passed" else 1


def main() -> int:
    parser = argparse.ArgumentParser(description="RedTeam AX live Report Studio browser/parser readiness smoke.")
    parser.add_argument("--allow-browser", action="store_true", help="Opt in to Playwright browser automation.")
    parser.add_argument("--require-live", action="store_true", help="Return non-zero if live services/browser smoke are not ready.")
    parser.add_argument("--frontend-url", default="http://127.0.0.1:5177")
    parser.add_argument("--backend-url", default="http://127.0.0.1:8765")
    parser.add_argument("--frontend-port", type=int, default=5177)
    parser.add_argument("--backend-port", type=int, default=8765)
    parser.add_argument("--timeout", type=int, default=60)
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
