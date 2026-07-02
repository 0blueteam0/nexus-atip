from __future__ import annotations

import json
import sys
import threading
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from fastapi.testclient import TestClient


PROJECT_ROOT = Path(__file__).resolve().parents[3]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

ARTIFACT_DIR = PROJECT_ROOT / "archive" / "runs" / "redteam-ax-v2-openvas-zap-service-import-smoke"
ARTIFACT_PATH = ARTIFACT_DIR / "latest_openvas_zap_service_import_smoke.json"
CASE_ID = "CASE-V2-OPENVAS-ZAP-SERVICE-IMPORT-001"

OPENVAS_XML = """<?xml version="1.0" encoding="UTF-8"?>
<report>
  <results>
    <result>
      <id>ov-result-001</id>
      <name>TLS certificate uses weak signature algorithm</name>
      <host>127.0.0.1</host>
      <port>443/tcp</port>
      <threat>Medium</threat>
      <severity>5.0</severity>
      <description>Read-only fixture report for RedTeam AX service import smoke.</description>
    </result>
  </results>
</report>
"""

ZAP_JSON = {
    "site": [
        {
            "@name": "http://127.0.0.1:5177",
            "alerts": [
                {
                    "pluginid": "10021",
                    "name": "X-Content-Type-Options Header Missing",
                    "riskcode": "1",
                    "confidence": "Medium",
                    "cweid": "693",
                    "wascid": "15",
                    "instances": [{"uri": "http://127.0.0.1:5177/report-studio"}],
                }
            ],
        }
    ]
}


def now_utc() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


class ScannerReportHandler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        if self.path == "/openvas/report.xml":
            body = OPENVAS_XML.encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/xml; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        if self.path == "/zap/alerts.json":
            body = json.dumps(ZAP_JSON, ensure_ascii=False).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        self.send_response(404)
        self.end_headers()

    def log_message(self, format: str, *args: object) -> None:
        return


def start_report_server() -> tuple[ThreadingHTTPServer, str]:
    server = ThreadingHTTPServer(("127.0.0.1", 0), ScannerReportHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    host, port = server.server_address
    return server, f"http://{host}:{port}"


def authorize(client: TestClient, tool_id: str, endpoint_url: str, scopes: list[str]) -> dict:
    response = client.post(
        f"/api/redteam/v2/tool-credential-authorizations/{tool_id}",
        headers={"X-RedTeam-Actor": "lead@example.com", "X-RedTeam-Actor-Role": "red_team_lead"},
        json={
            "case_id": CASE_ID,
            "credential_ref": f"vault://redteam-ax/{tool_id.lower()}/readonly",
            "endpoint_ref": endpoint_url,
            "token_scopes": scopes,
            "read_only": True,
            "purpose": "Read-only scanner report import smoke; no active scan or mutating operation.",
            "target_scope_refs": ["SCOPE-APPROVED-LOCAL-LAB"],
        },
    )
    return response.json()


def import_report(client: TestClient, tool_id: str, authorization: dict, endpoint_url: str) -> dict:
    response = client.post(
        f"/api/redteam/v2/scanner-service-imports/{tool_id}",
        json={
            "case_id": CASE_ID,
            "authorization_id": authorization.get("authorization_id"),
            "endpoint_url": endpoint_url,
            "requested_by": "analyst@example.com",
            "target_scope_refs": ["SCOPE-APPROVED-LOCAL-LAB"],
            "timeout": 5,
        },
    )
    return response.json()


def import_invalid_secret_probe(client: TestClient, authorization: dict, endpoint_url: str) -> dict:
    response = client.post(
        "/api/redteam/v2/scanner-service-imports/TOOL-ZAP-001",
        json={
            "case_id": CASE_ID,
            "authorization_id": authorization.get("authorization_id"),
            "endpoint_url": endpoint_url,
            "api_key": "must-not-be-accepted",
            "target_scope_refs": ["SCOPE-APPROVED-LOCAL-LAB"],
        },
    )
    return response.json()


def main() -> int:
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    from runtime import malware_upload_api

    client = TestClient(malware_upload_api.app)
    server, base_url = start_report_server()
    try:
        openvas_endpoint = f"{base_url}/openvas/report.xml"
        zap_endpoint = f"{base_url}/zap/alerts.json"
        openvas_auth = authorize(client, "TOOL-OPENVAS-001", openvas_endpoint, ["read:reports"])
        zap_auth = authorize(client, "TOOL-ZAP-001", zap_endpoint, ["read:alerts", "read:reports"])
        openvas_import = import_report(client, "TOOL-OPENVAS-001", openvas_auth, openvas_endpoint)
        zap_import = import_report(client, "TOOL-ZAP-001", zap_auth, zap_endpoint)
        invalid_secret_probe = import_invalid_secret_probe(client, zap_auth, zap_endpoint)
    finally:
        server.shutdown()
        server.server_close()

    imports = [openvas_import, zap_import]
    failed = [
        item
        for item in imports
        if item.get("status") != "passed"
        or item.get("policy", {}).get("active_scan_executed") is not False
        or item.get("policy", {}).get("secret_material_stored") is not False
        or item.get("policy", {}).get("trusted_as_instruction") is not False
        or int(item.get("agent_analyze", {}).get("structured_item_count") or 0) < 1
        or item.get("evidence", {}).get("status") == "invalid"
    ]
    result = {
        "kind": "redteam_ax_openvas_zap_service_import_smoke",
        "created_at": now_utc(),
        "case_id": CASE_ID,
        "status": "passed" if not failed and invalid_secret_probe.get("status") == "invalid" else "failed",
        "safe_by_default": True,
        "service_endpoint_fetch_executed": True,
        "scanner_commands_executed_by_api": False,
        "active_scan_executed": False,
        "secret_material_stored": False,
        "trusted_as_instruction": False,
        "requires_human_validation": True,
        "service_base_url": base_url,
        "authorizations": {
            "openvas": {
                "status": openvas_auth.get("status"),
                "authorization_id": openvas_auth.get("authorization_id"),
                "errors": openvas_auth.get("errors") or [],
            },
            "zap": {
                "status": zap_auth.get("status"),
                "authorization_id": zap_auth.get("authorization_id"),
                "errors": zap_auth.get("errors") or [],
            },
        },
        "imports": {
            "openvas": openvas_import,
            "zap": zap_import,
        },
        "negative_controls": {
            "secret_material_submission": {
                "status": invalid_secret_probe.get("status"),
                "errors": invalid_secret_probe.get("errors") or [],
            }
        },
        "failed_tools": [item.get("tool_id") for item in failed],
    }
    ARTIFACT_PATH.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8", newline="\n")
    print(
        json.dumps(
            {
                "status": result["status"],
                "artifact_path": ARTIFACT_PATH.as_posix(),
                "passed_tools": [tool_id for tool_id, item in result["imports"].items() if item.get("status") == "passed"],
                "failed_tools": result["failed_tools"],
                "negative_secret_probe": result["negative_controls"]["secret_material_submission"]["status"],
            },
            ensure_ascii=False,
        )
    )
    return 0 if result["status"] == "passed" else 1


if __name__ == "__main__":
    raise SystemExit(main())
