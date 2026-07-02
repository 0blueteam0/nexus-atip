from __future__ import annotations

import argparse
import hashlib
import json
import os
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import parse_qs, urlparse


PROJECT_ROOT = Path(__file__).resolve().parents[3]
ARTIFACT_DIR = PROJECT_ROOT / "archive" / "runs" / "redteam-ax-v2-external-scanner-readiness"
ARTIFACT_PATH = ARTIFACT_DIR / "latest_external_scanner_service_readiness.json"

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


def _safe_endpoint(url: str) -> tuple[bool, list[str]]:
    errors: list[str] = []
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"}:
        errors.append("endpoint_scheme_must_be_http_or_https")
    if parsed.username or parsed.password:
        errors.append("endpoint_must_not_embed_credentials")
    query_keys = {key.lower() for key in parse_qs(parsed.query).keys()}
    if query_keys.intersection(SECRET_QUERY_KEYS):
        errors.append("endpoint_query_must_not_contain_secret_material")
    path_terms = {part.lower() for part in parsed.path.replace("-", "/").replace("_", "/").split("/") if part}
    if path_terms.intersection(MUTATING_PATH_TERMS):
        errors.append("endpoint_path_looks_mutating_not_read_only_report")
    if not parsed.netloc:
        errors.append("endpoint_host_required")
    return not errors, errors


def _probe_endpoint(url: str, timeout: int) -> dict:
    request = urllib.request.Request(
        url,
        method="GET",
        headers={
            "Accept": "application/json, application/xml, text/xml, text/plain;q=0.8, */*;q=0.1",
            "User-Agent": "RedTeam-AX-external-scanner-readiness/1.0",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            body = response.read(4096)
            return {
                "network_probe_executed": True,
                "status": "reachable",
                "http_status": response.status,
                "content_type": response.headers.get("Content-Type", ""),
                "sample_sha256": hashlib.sha256(body).hexdigest(),
                "sample_size_bytes": len(body),
            }
    except urllib.error.HTTPError as exc:
        return {
            "network_probe_executed": True,
            "status": "http_error",
            "http_status": exc.code,
            "content_type": exc.headers.get("Content-Type", ""),
            "error": str(exc),
        }
    except Exception as exc:  # noqa: BLE001 - readiness artifact should preserve exact blocker.
        return {
            "network_probe_executed": True,
            "status": "unreachable",
            "error": str(exc),
        }


def _tool_readiness(tool_name: str, endpoint_env: str, vault_env: str, allow_network: bool, timeout: int) -> dict:
    endpoint = os.environ.get(endpoint_env, "").strip()
    vault_ref = os.environ.get(vault_env, "").strip()
    item = {
        "tool": tool_name,
        "endpoint_env": endpoint_env,
        "vault_ref_env": vault_env,
        "endpoint_configured": bool(endpoint),
        "external_vault_ref_configured": bool(vault_ref),
        "secret_material_stored": False,
        "active_scan_executed": False,
        "trusted_as_instruction": False,
        "commands_executed_by_api": False,
        "network_probe_allowed": allow_network,
    }
    if not endpoint:
        return {**item, "status": "not_configured", "blockers": [f"{endpoint_env}_missing"]}
    safe, errors = _safe_endpoint(endpoint)
    item["endpoint_url"] = endpoint
    item["endpoint_safety_errors"] = errors
    if not safe:
        return {**item, "status": "invalid_endpoint", "blockers": errors}
    if not vault_ref:
        return {**item, "status": "vault_ref_missing", "blockers": [f"{vault_env}_missing"]}
    if not allow_network:
        return {**item, "status": "configured_network_probe_not_requested", "blockers": ["set_REDTEAM_AX_EXTERNAL_SCANNER_READINESS_ALLOW_NETWORK=1_to_probe"]}
    probe = _probe_endpoint(endpoint, timeout)
    status = "ready" if probe.get("status") == "reachable" and int(probe.get("http_status") or 0) < 400 else "endpoint_probe_failed"
    return {**item, "status": status, "network_probe": probe, "blockers": [] if status == "ready" else [probe.get("error") or probe.get("status")]}


def build_readiness(args: argparse.Namespace) -> tuple[dict, int]:
    allow_network = args.allow_network or os.environ.get("REDTEAM_AX_EXTERNAL_SCANNER_READINESS_ALLOW_NETWORK", "").lower() in {"1", "true", "yes"}
    openvas = _tool_readiness(
        "OpenVAS",
        "REDTEAM_AX_OPENVAS_READONLY_REPORT_ENDPOINT",
        "REDTEAM_AX_OPENVAS_VAULT_REF",
        allow_network,
        args.timeout,
    )
    zap = _tool_readiness(
        "OWASP ZAP",
        "REDTEAM_AX_ZAP_READONLY_ALERT_ENDPOINT",
        "REDTEAM_AX_ZAP_VAULT_REF",
        allow_network,
        args.timeout,
    )
    tools = [openvas, zap]
    ready_count = sum(1 for item in tools if item["status"] == "ready")
    configured_count = sum(1 for item in tools if item["endpoint_configured"])
    status = "ready" if ready_count == len(tools) else "blocked_external_scanner_services_not_ready"
    blockers = {
        item["tool"]: item.get("blockers", [])
        for item in tools
        if item["status"] != "ready"
    }
    result = {
        "kind": "redteam_ax_external_scanner_service_readiness",
        "created_at": now_utc(),
        "status": status,
        "safe_by_default": True,
        "network_probe_allowed": allow_network,
        "configured_count": configured_count,
        "ready_count": ready_count,
        "required_ready_count": len(tools),
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
            "Set REDTEAM_AX_EXTERNAL_SCANNER_READINESS_ALLOW_NETWORK=1 only after ROE approves endpoint reachability checks.",
        ],
    }
    exit_code = 0
    if args.require_ready and status != "ready":
        exit_code = 2
    return result, exit_code


def main() -> int:
    parser = argparse.ArgumentParser(description="RedTeam AX external OpenVAS/ZAP read-only service readiness checker.")
    parser.add_argument("--allow-network", action="store_true", help="Probe configured endpoints with read-only GET.")
    parser.add_argument("--require-ready", action="store_true", help="Return non-zero unless both external services are ready.")
    parser.add_argument("--timeout", type=int, default=10)
    args = parser.parse_args()
    result, exit_code = build_readiness(args)
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    ARTIFACT_PATH.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8", newline="\n")
    print(json.dumps({
        "status": result["status"],
        "artifact_path": ARTIFACT_PATH.as_posix(),
        "configured_count": result["configured_count"],
        "ready_count": result["ready_count"],
        "blockers": result["blockers"],
    }, ensure_ascii=False))
    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())
