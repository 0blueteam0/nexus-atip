from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from fastapi.testclient import TestClient


PROJECT_ROOT = Path(__file__).resolve().parents[3]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

ARTIFACT_DIR = PROJECT_ROOT / "archive" / "runs" / "redteam-ax-v2-external-scanner-service-import-live"
ARTIFACT_PATH = ARTIFACT_DIR / "latest_external_scanner_service_import_live_smoke.json"
CASE_ID = "CASE-V2-EXTERNAL-SCANNER-SERVICE-IMPORT-LIVE-001"

SECRET_QUERY_KEYS = {
    "api_key",
    "apikey",
    "token",
    "access_token",
    "bearer",
    "password",
    "passwd",
    "secret",
    "client_secret",
    "cookie",
}
MUTATING_PATH_TERMS = {
    "start",
    "scan",
    "spider",
    "attack",
    "delete",
    "remove",
    "update",
    "create",
    "write",
    "modify",
}


def now_utc() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def endpoint_errors(url: str) -> list[str]:
    parsed = urlparse(url)
    errors: list[str] = []
    if parsed.scheme not in {"http", "https"}:
        errors.append("endpoint_scheme_must_be_http_or_https")
    if parsed.username or parsed.password:
        errors.append("endpoint_must_not_embed_credentials")
    if not parsed.netloc:
        errors.append("endpoint_host_required")
    query_keys = {key.lower() for key in parse_qs(parsed.query).keys()}
    if query_keys.intersection(SECRET_QUERY_KEYS):
        errors.append("endpoint_query_must_not_contain_secret_material")
    path_terms = {part.lower() for part in parsed.path.replace("-", "/").replace("_", "/").split("/") if part}
    if path_terms.intersection(MUTATING_PATH_TERMS):
        errors.append("endpoint_path_looks_mutating_not_read_only_report")
    return errors


def tool_config(tool_id: str, tool_name: str, endpoint_env: str, vault_env: str, scopes: list[str]) -> dict:
    endpoint_url = os.environ.get(endpoint_env, "").strip()
    vault_ref = os.environ.get(vault_env, "").strip()
    errors: list[str] = []
    if not endpoint_url:
        errors.append(f"{endpoint_env}_missing")
    else:
        errors.extend(endpoint_errors(endpoint_url))
    if not vault_ref:
        errors.append(f"{vault_env}_missing")
    elif not vault_ref.startswith(("vault://", "secret://", "external-vault://")):
        errors.append(f"{vault_env}_must_be_external_vault_reference")
    return {
        "tool_id": tool_id,
        "tool_name": tool_name,
        "endpoint_env": endpoint_env,
        "vault_ref_env": vault_env,
        "endpoint_configured": bool(endpoint_url),
        "external_vault_ref_configured": bool(vault_ref),
        "endpoint_url": endpoint_url,
        "credential_ref": vault_ref,
        "token_scopes": scopes,
        "status": "configured" if not errors else "blocked",
        "blockers": errors,
        "secret_material_stored": False,
        "active_scan_executed": False,
        "trusted_as_instruction": False,
    }


def authorize(client: TestClient, item: dict) -> dict:
    response = client.post(
        f"/api/redteam/v2/tool-credential-authorizations/{item['tool_id']}",
        headers={"X-RedTeam-Actor": "lead@example.com", "X-RedTeam-Actor-Role": "red_team_lead"},
        json={
            "case_id": CASE_ID,
            "credential_ref": item["credential_ref"],
            "endpoint_ref": item["endpoint_url"],
            "token_scopes": item["token_scopes"],
            "read_only": True,
            "purpose": "Organization read-only scanner report import live smoke; no active scan or mutating operation.",
            "target_scope_refs": ["SCOPE-APPROVED-EXTERNAL-SCANNER-READONLY"],
        },
    )
    return response.json()


def import_report(client: TestClient, item: dict, authorization: dict, timeout: int) -> dict:
    response = client.post(
        f"/api/redteam/v2/scanner-service-imports/{item['tool_id']}",
        json={
            "case_id": CASE_ID,
            "authorization_id": authorization.get("authorization_id"),
            "endpoint_url": item["endpoint_url"],
            "requested_by": "analyst@example.com",
            "target_scope_refs": ["SCOPE-APPROVED-EXTERNAL-SCANNER-READONLY"],
            "timeout": timeout,
        },
    )
    return response.json()


def negative_secret_probe(client: TestClient, item: dict, authorization: dict) -> dict:
    response = client.post(
        f"/api/redteam/v2/scanner-service-imports/{item['tool_id']}",
        json={
            "case_id": CASE_ID,
            "authorization_id": authorization.get("authorization_id"),
            "endpoint_url": item["endpoint_url"],
            "api_key": "must-not-be-accepted",
            "target_scope_refs": ["SCOPE-APPROVED-EXTERNAL-SCANNER-READONLY"],
        },
    )
    return response.json()


def build_blocked_result(args: argparse.Namespace, tools: list[dict], status: str, blockers: dict[str, list[str]]) -> dict:
    return {
        "kind": "redteam_ax_external_scanner_service_import_live_smoke",
        "created_at": now_utc(),
        "case_id": CASE_ID,
        "status": status,
        "safe_by_default": True,
        "network_import_allowed": bool(args.allow_network),
        "service_endpoint_fetch_executed": False,
        "scanner_commands_executed_by_api": False,
        "active_scan_executed": False,
        "secret_material_stored": False,
        "trusted_as_instruction": False,
        "requires_human_validation": True,
        "tools": tools,
        "blockers": blockers,
        "operator_next_steps": [
            "Set REDTEAM_AX_OPENVAS_READONLY_REPORT_ENDPOINT to an approved read-only OpenVAS report URL.",
            "Set REDTEAM_AX_ZAP_READONLY_ALERT_ENDPOINT to an approved read-only ZAP alert/report URL.",
            "Set REDTEAM_AX_OPENVAS_VAULT_REF and REDTEAM_AX_ZAP_VAULT_REF to external vault references, not secret values.",
            "Rerun with REDTEAM_AX_EXTERNAL_SCANNER_IMPORT_ALLOW_NETWORK=1 or --allow-network after ROE approves read-only endpoint import.",
            "Use --require-ready in controlled validation when both organization endpoints must pass.",
        ],
    }


def build_live_result(args: argparse.Namespace, tools: list[dict]) -> dict:
    from runtime import malware_upload_api

    client = TestClient(malware_upload_api.app)
    imports: dict[str, dict] = {}
    authorizations: dict[str, dict] = {}
    negative_controls: dict[str, dict] = {}
    for item in tools:
        auth = authorize(client, item)
        authorizations[item["tool_id"]] = {
            "status": auth.get("status"),
            "authorization_id": auth.get("authorization_id"),
            "errors": auth.get("errors") or [],
        }
        if auth.get("status") != "authorized":
            imports[item["tool_id"]] = {"status": "authorization_failed", "errors": auth.get("errors") or []}
            continue
        imported = import_report(client, item, auth, args.timeout)
        imports[item["tool_id"]] = imported
        negative = negative_secret_probe(client, item, auth)
        negative_controls[item["tool_id"]] = {
            "status": negative.get("status"),
            "errors": negative.get("errors") or [],
        }

    failed_tools = []
    for item in tools:
        imported = imports.get(item["tool_id"], {})
        if (
            imported.get("status") != "passed"
            or imported.get("policy", {}).get("active_scan_executed") is not False
            or imported.get("policy", {}).get("secret_material_stored") is not False
            or imported.get("policy", {}).get("trusted_as_instruction") is not False
            or int(imported.get("agent_analyze", {}).get("structured_item_count") or 0) < 1
            or imported.get("evidence", {}).get("status") == "invalid"
        ):
            failed_tools.append(item["tool_id"])
        if negative_controls.get(item["tool_id"], {}).get("status") != "invalid":
            failed_tools.append(f"{item['tool_id']}:negative_secret_probe")

    return {
        "kind": "redteam_ax_external_scanner_service_import_live_smoke",
        "created_at": now_utc(),
        "case_id": CASE_ID,
        "status": "passed" if not failed_tools else "failed",
        "safe_by_default": True,
        "network_import_allowed": True,
        "service_endpoint_fetch_executed": True,
        "scanner_commands_executed_by_api": False,
        "active_scan_executed": False,
        "secret_material_stored": False,
        "trusted_as_instruction": False,
        "requires_human_validation": True,
        "tools": tools,
        "authorizations": authorizations,
        "imports": imports,
        "negative_controls": negative_controls,
        "failed_tools": failed_tools,
    }


def build_result(args: argparse.Namespace) -> tuple[dict, int]:
    allow_network = args.allow_network or os.environ.get("REDTEAM_AX_EXTERNAL_SCANNER_IMPORT_ALLOW_NETWORK", "").lower() in {"1", "true", "yes"}
    tools = [
        tool_config("TOOL-OPENVAS-001", "OpenVAS", "REDTEAM_AX_OPENVAS_READONLY_REPORT_ENDPOINT", "REDTEAM_AX_OPENVAS_VAULT_REF", ["read:reports"]),
        tool_config("TOOL-ZAP-001", "OWASP ZAP", "REDTEAM_AX_ZAP_READONLY_ALERT_ENDPOINT", "REDTEAM_AX_ZAP_VAULT_REF", ["read:alerts", "read:reports"]),
    ]
    blockers = {item["tool_name"]: item["blockers"] for item in tools if item["blockers"]}
    if blockers:
        result = build_blocked_result(args, tools, "blocked_external_scanner_import_not_ready", blockers)
        return result, 2 if args.require_ready else 0
    if not allow_network:
        result = build_blocked_result(
            args,
            tools,
            "configured_network_import_not_requested",
            {"network": ["set_REDTEAM_AX_EXTERNAL_SCANNER_IMPORT_ALLOW_NETWORK=1_or_use_--allow-network"]},
        )
        return result, 2 if args.require_ready else 0
    result = build_live_result(args, tools)
    return result, 0 if result["status"] == "passed" else 1


def main() -> int:
    parser = argparse.ArgumentParser(description="RedTeam AX organization OpenVAS/ZAP read-only service import live smoke.")
    parser.add_argument("--allow-network", action="store_true", help="Import configured endpoint reports with read-only GET through the backend adapter.")
    parser.add_argument("--require-ready", action="store_true", help="Return non-zero unless both external service imports pass.")
    parser.add_argument("--timeout", type=int, default=15)
    args = parser.parse_args()
    result, exit_code = build_result(args)
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    ARTIFACT_PATH.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8", newline="\n")
    print(json.dumps({
        "status": result["status"],
        "artifact_path": ARTIFACT_PATH.as_posix(),
        "service_endpoint_fetch_executed": result["service_endpoint_fetch_executed"],
        "blockers": result.get("blockers", {}),
        "failed_tools": result.get("failed_tools", []),
    }, ensure_ascii=False))
    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())
