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
        stdout = completed.stdout or ""
        stderr = completed.stderr or ""
        return {
            "argv": argv,
            "cwd": str(cwd),
            "exit_code": completed.returncode,
            "stdout": stdout,
            "stdout_truncated": False,
            "stderr": stderr[:12000],
            "stderr_truncated": len(stderr) > 12000,
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


def playwright_browser_smoke(
    frontend_url: str,
    timeout: int,
    allow_action: bool,
    allow_approval_request: bool,
    allow_approval_grant: bool,
) -> dict[str, Any]:
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    script_path = ARTIFACT_DIR / "live_browser_parser_probe.mjs"
    script_path.write_text(
        """
import { chromium } from 'playwright';

const url = process.argv[2];
const allowAction = process.argv[3] === 'allow-action';
const allowApprovalRequest = process.argv[4] === 'allow-approval-request';
const allowApprovalGrant = process.argv[5] === 'allow-approval-grant';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
const result = { url, checks: {}, apiResponses: [] };
let afterRequestBodyText = null;
let requestApprovalButtonVisibleAfterSubmit = null;
let executeButtonVisibleAfterSubmit = null;
let executeButtonDisabledAfterSubmit = null;
try {
  page.on('response', async (response) => {
    const responseUrl = response.url();
    if (!responseUrl.includes('/api/redteam/v2/')) return;
    let body = '';
    let parsed = null;
    try {
      body = await response.text();
      parsed = JSON.parse(body);
    } catch {}
    result.apiResponses.push({
      url: responseUrl,
      endpoint: new URL(responseUrl).pathname,
      status: response.status(),
      kind: parsed && parsed.kind ? parsed.kind : null,
      actionId: parsed && parsed.action_id ? parsed.action_id : null,
      statusField: parsed && parsed.status ? parsed.status : null,
      actionStatus: parsed && parsed.action && parsed.action.status ? parsed.action.status : null,
      requiredApprovers: parsed && Array.isArray(parsed.required_approvers) ? parsed.required_approvers : null,
      allowedButtons: parsed && Array.isArray(parsed.allowed_buttons) ? parsed.allowed_buttons : null,
      actionAllowedButtons: parsed && parsed.action && Array.isArray(parsed.action.allowed_buttons) ? parsed.action.allowed_buttons : null,
      errors: parsed && Array.isArray(parsed.errors) ? parsed.errors : null,
      itemCount: parsed && parsed.count != null ? parsed.count : null,
      bodyPrefix: body.slice(0, 120),
    });
  });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.locator('body').waitFor({ state: 'visible', timeout: 10000 });
  await page.getByRole('button', { name: /보고서 스튜디오|Report Studio/ }).click({ timeout: 10000 }).catch(() => {});
  await page.getByRole('button', { name: /레드팀 분석2|RedTeam AX v2/ }).click({ timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(2500);
  if (allowAction) {
    await page.getByRole('button', { name: /ToolActionCard 계획/ }).click({ timeout: 10000 });
    await page.waitForTimeout(3000);
  }
  if (allowApprovalRequest) {
    await page.getByRole('button', { name: /Request Approval/ }).first().click({ timeout: 10000 });
    await page.waitForTimeout(3000);
    afterRequestBodyText = await page.locator('body').innerText({ timeout: 5000 }).catch(() => '');
    requestApprovalButtonVisibleAfterSubmit = await page.getByRole('button', { name: /Request Approval/ }).first().isVisible({ timeout: 2000 }).catch(() => false);
    const executeButtonAfterSubmit = page.getByRole('button', { name: /Execute Governed Runner/ }).first();
    executeButtonVisibleAfterSubmit = await executeButtonAfterSubmit.isVisible({ timeout: 2000 }).catch(() => false);
    executeButtonDisabledAfterSubmit = executeButtonVisibleAfterSubmit ? await executeButtonAfterSubmit.isDisabled().catch(() => false) : null;
  }
  if (allowApprovalGrant) {
    await page.getByRole('button', { name: /Approve HITL/ }).first().click({ timeout: 10000 });
    await page.waitForTimeout(3000);
    const approvalResponse = result.apiResponses.find((item) => item.url.includes('/approve') && item.endpoint.includes('/tool-actions/'));
    const approvedActionId = approvalResponse ? approvalResponse.actionId : null;
    if (approvedActionId) {
      const manualRunResponse = await page.evaluate(async ({ actionId }) => {
        const response = await fetch(`http://127.0.0.1:8765/api/redteam/v2/tool-actions/${encodeURIComponent(actionId)}/manual-run-record`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            case_id: 'RTA-2026-0301-SCOPE-RUN-http-127-0-0-1-30001',
            executed_by: 'operator@example.com',
            notes: 'Approval grant smoke verifies uploaded artifact gate; no runner execution.',
            uploaded_artifacts: [],
          }),
        });
        const body = await response.text();
        let parsed = null;
        try { parsed = JSON.parse(body); } catch {}
        return {
          url: response.url,
          endpoint: new URL(response.url).pathname,
          status: response.status,
          kind: parsed && parsed.kind ? parsed.kind : null,
          actionId,
          statusField: parsed && parsed.status ? parsed.status : null,
          errors: parsed && Array.isArray(parsed.errors) ? parsed.errors : null,
          bodyPrefix: body.slice(0, 120),
        };
      }, { actionId: approvedActionId });
      result.apiResponses.push(manualRunResponse);
    }
  }
  result.title = await page.title();
  result.finalUrl = page.url();
  const bodyText = await page.locator('body').innerText({ timeout: 5000 }).catch(() => '');
  result.bodyPrefix = bodyText.slice(0, 1000);
  const requestApprovalButtonVisible = await page.getByRole('button', { name: /Request Approval/ }).first().isVisible({ timeout: 2000 }).catch(() => false);
  const approveHitlButtonVisible = await page.getByRole('button', { name: /Approve HITL/ }).first().isVisible({ timeout: 2000 }).catch(() => false);
  const executeButton = page.getByRole('button', { name: /Execute Governed Runner/ }).first();
  const executeButtonVisible = await executeButton.isVisible({ timeout: 2000 }).catch(() => false);
  const executeButtonDisabled = executeButtonVisible ? await executeButton.isDisabled().catch(() => false) : null;
  result.checks.reportStudio = bodyText.includes('보고서 스튜디오') || bodyText.includes('Report Studio');
  result.checks.redteamAnalysis = bodyText.includes('레드팀 분석');
  result.checks.redteamAnalysis2 = bodyText.includes('레드팀 분석2') || bodyText.includes('RedTeam AX v2');
  result.checks.toolActionCard = bodyText.includes('ToolActionCard');
  result.checks.hitlGate = bodyText.includes('HITL');
  result.checks.evidenceGate = bodyText.includes('Evidence Card') || bodyText.includes('Claim-Evidence Matrix');
  if (allowAction) {
    const planResponse = result.apiResponses.find((item) => item.url.endsWith('/api/redteam/v2/tool-actions/plan'));
    result.toolActionPlan = {
      responseFound: Boolean(planResponse),
      responseStatus: planResponse ? planResponse.status : null,
      actionId: planResponse ? planResponse.actionId : null,
      actionIdPresent: Boolean(planResponse && /^TAC-[A-Z0-9-]+$/.test(planResponse.actionId || '')) || /TAC-[A-Z0-9-]+/.test(bodyText),
      requestApprovalAvailable: (planResponse && Array.isArray(planResponse.allowedButtons) && planResponse.allowedButtons.includes('Request Approval')) || bodyText.includes('Request Approval'),
      requestApprovalVisible: bodyText.includes('Request Approval'),
      roeVisible: bodyText.includes('ROE'),
      hitlVisible: bodyText.includes('HITL'),
      governedRunnerNotClicked: true,
    };
    result.checks.toolActionPlanCreated = result.toolActionPlan.responseFound
      && result.toolActionPlan.responseStatus === 200
      && result.toolActionPlan.actionIdPresent
      && result.toolActionPlan.requestApprovalAvailable
      && result.toolActionPlan.roeVisible
      && result.toolActionPlan.hitlVisible
      && result.toolActionPlan.governedRunnerNotClicked;
  }
  if (allowApprovalRequest) {
    const approvalResponse = result.apiResponses.find((item) => item.url.includes('/request-approval'));
    result.approvalQueue = {
      responseFound: Boolean(approvalResponse),
      responseStatus: approvalResponse ? approvalResponse.status : null,
      statusField: approvalResponse ? approvalResponse.statusField : null,
      actionStatus: approvalResponse ? approvalResponse.actionStatus : null,
      requiredApprovers: approvalResponse ? approvalResponse.requiredApprovers : null,
      queueStatusVisible: (afterRequestBodyText || bodyText).includes('ApprovalRequested'),
      requestButtonVisibleAfterSubmit: requestApprovalButtonVisibleAfterSubmit !== null ? requestApprovalButtonVisibleAfterSubmit : requestApprovalButtonVisible,
      requestButtonHiddenAfterSubmit: (requestApprovalButtonVisibleAfterSubmit !== null ? requestApprovalButtonVisibleAfterSubmit : requestApprovalButtonVisible) === false,
      executeButtonVisible: executeButtonVisibleAfterSubmit !== null ? executeButtonVisibleAfterSubmit : executeButtonVisible,
      executeButtonDisabled: executeButtonDisabledAfterSubmit !== null ? executeButtonDisabledAfterSubmit : executeButtonDisabled,
      governedRunnerNotClicked: true,
      governedRunnerBlockedBeforeApproval: (executeButtonVisibleAfterSubmit !== null ? executeButtonVisibleAfterSubmit : executeButtonVisible) === true
        && (executeButtonDisabledAfterSubmit !== null ? executeButtonDisabledAfterSubmit : executeButtonDisabled) === true,
    };
    result.checks.approvalQueueRequested = result.approvalQueue.responseFound
      && result.approvalQueue.responseStatus === 200
      && result.approvalQueue.statusField === 'ApprovalRequested'
      && result.approvalQueue.actionStatus === 'ApprovalRequested'
      && Array.isArray(result.approvalQueue.requiredApprovers)
      && result.approvalQueue.requiredApprovers.length > 0
      && result.approvalQueue.queueStatusVisible
      && result.approvalQueue.requestButtonHiddenAfterSubmit
      && result.approvalQueue.governedRunnerBlockedBeforeApproval
      && result.approvalQueue.governedRunnerNotClicked;
  }
  if (allowApprovalGrant) {
    const grantResponse = result.apiResponses.find((item) => item.url.includes('/approve') && item.endpoint.includes('/tool-actions/'));
    const manualRunResponse = result.apiResponses.find((item) => item.url.includes('/manual-run-record'));
    result.approvalGrant = {
      responseFound: Boolean(grantResponse),
      responseStatus: grantResponse ? grantResponse.status : null,
      statusField: grantResponse ? grantResponse.statusField : null,
      actionStatus: grantResponse ? grantResponse.actionStatus : null,
      runInLabAllowed: Boolean(grantResponse && Array.isArray(grantResponse.actionAllowedButtons) && grantResponse.actionAllowedButtons.includes('Run in Lab')),
      approveHitlButtonHiddenAfterGrant: approveHitlButtonVisible === false,
      manualRunGateChecked: Boolean(manualRunResponse),
      manualRunResponseStatus: manualRunResponse ? manualRunResponse.status : null,
      manualRunStatus: manualRunResponse ? manualRunResponse.statusField : null,
      manualRunErrors: manualRunResponse ? manualRunResponse.errors : null,
      uploadedArtifactsRequired: Boolean(manualRunResponse && Array.isArray(manualRunResponse.errors) && manualRunResponse.errors.includes('uploaded_artifacts_required')),
      governedRunnerNotClicked: true,
      governedRunnerNotExecuted: true,
    };
    result.checks.approvalGrantReady = result.approvalGrant.responseFound
      && result.approvalGrant.responseStatus === 200
      && result.approvalGrant.statusField === 'Approved'
      && result.approvalGrant.actionStatus === 'Approved'
      && result.approvalGrant.runInLabAllowed
      && result.approvalGrant.approveHitlButtonHiddenAfterGrant
      && result.approvalGrant.manualRunGateChecked
      && result.approvalGrant.manualRunStatus === 'invalid'
      && result.approvalGrant.uploadedArtifactsRequired
      && result.approvalGrant.governedRunnerNotClicked
      && result.approvalGrant.governedRunnerNotExecuted;
  }
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
    action_arg = "allow-action" if allow_action else "dom-only"
    approval_arg = "allow-approval-request" if allow_approval_request else "approval-request-disabled"
    grant_arg = "allow-approval-grant" if allow_approval_grant else "approval-grant-disabled"
    probe = run_command([node_executable(), str(script_path), frontend_url, action_arg, approval_arg, grant_arg], cwd=FRONTEND_ROOT, timeout=timeout)
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
        "allow_browser_action_smoke": args.allow_action,
        "allow_browser_approval_request_smoke": args.allow_approval_request,
        "allow_browser_approval_grant_smoke": args.allow_approval_grant,
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
    if args.allow_action and not allow_browser:
        result["status"] = "blocked_action_smoke_requires_browser"
        result["blockers"] = ["action_smoke_requires_allow_browser"]
        return result, 2 if args.require_live else 0
    if args.allow_approval_request and not args.allow_action:
        result["status"] = "blocked_approval_request_smoke_requires_action"
        result["blockers"] = ["approval_request_smoke_requires_allow_action"]
        return result, 2 if args.require_live else 0
    if args.allow_approval_grant and not args.allow_approval_request:
        result["status"] = "blocked_approval_grant_smoke_requires_approval_request"
        result["blockers"] = ["approval_grant_smoke_requires_allow_approval_request"]
        return result, 2 if args.require_live else 0
    if not (FRONTEND_ROOT / "node_modules" / "playwright").exists():
        result["status"] = "blocked_playwright_dependency_not_installed"
        result["blockers"] = ["frontend_node_modules_playwright_not_found"]
        return result, 2 if args.require_live else 0
    result["browser_automation_executed"] = True
    browser = playwright_browser_smoke(
        frontend_url + "/",
        args.timeout,
        args.allow_action,
        args.allow_approval_request,
        args.allow_approval_grant,
    )
    result["browser_smoke"] = browser
    result["status"] = "passed" if browser.get("status") == "passed" else "failed_browser_dom_parser_smoke"
    result["blockers"] = [] if result["status"] == "passed" else [browser.get("status") or "browser_smoke_failed"]
    return result, 0 if result["status"] == "passed" else 1


def main() -> int:
    parser = argparse.ArgumentParser(description="RedTeam AX live Report Studio browser/parser readiness smoke.")
    parser.add_argument("--allow-browser", action="store_true", help="Opt in to Playwright browser automation.")
    parser.add_argument("--allow-action", action="store_true", help="Opt in to a safe UI ToolActionCard planning click. No runner execution is triggered.")
    parser.add_argument("--allow-approval-request", action="store_true", help="Opt in to requesting HITL approval after ToolActionCard planning. No approval grant or runner execution is triggered.")
    parser.add_argument("--allow-approval-grant", action="store_true", help="Opt in to granting the HITL approval in the UI smoke. No runner execution is triggered.")
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
