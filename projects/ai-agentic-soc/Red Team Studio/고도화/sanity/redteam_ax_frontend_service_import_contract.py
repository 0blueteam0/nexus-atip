from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
PROJECT_ROOT = ROOT.parents[0]
REPORTS_JS = (
    PROJECT_ROOT
    / "soc-frontend-vite-react"
    / "soc-frontend"
    / "idiomatic-react"
    / "src"
    / "store"
    / "methods"
    / "reports.js"
)


def _read_source() -> str:
    if not REPORTS_JS.exists():
        raise AssertionError(f"missing reports.js: {REPORTS_JS}")
    return REPORTS_JS.read_text(encoding="utf-8")


def _segment(source: str, start: str, end: str) -> str:
    start_idx = source.find(start)
    if start_idx < 0:
        raise AssertionError(f"missing segment start: {start}")
    end_idx = source.find(end, start_idx)
    if end_idx < 0:
        raise AssertionError(f"missing segment end after {start}: {end}")
    return source[start_idx:end_idx]


def main() -> int:
    source = _read_source()
    method = _segment(source, "  async importRedTeam2ScannerServiceReport() {", "  async executeRedTeam2GovernedRunner")
    redteam2_panel = _segment(source, "  redTeamAnalysis2Panel() {", "  redTeamAnalysisPanel() {")
    panel = _segment(source, "      smallPanel('OpenVAS/ZAP 서비스 결과 가져오기'", "      smallPanel('도구 실행 계획 / 샌드박스 정책'")

    required_method_terms = [
        "/api/redteam/v2/scanner-service-imports/",
        "toolchain_id:toolchainId",
        "authorization_id:authorizationId",
        "endpoint_url:endpointUrl",
        "requested_by:'current-analyst'",
        "target_scope_refs:",
        "timeout_seconds:",
        "redteam2ServiceImportState",
        "redteam2ToolchainRunStatusState",
        "loaded-from-service-import",
        "가져온 OpenVAS/ZAP 결과를 결과 회수·Evidence 후보 단계로 넘길 수 있습니다",
    ]
    missing_method_terms = [term for term in required_method_terms if term not in method]
    if missing_method_terms:
        raise AssertionError(f"missing service import method terms: {missing_method_terms}")

    forbidden_payload_terms = [
        "api_key",
        "password",
        "bearer",
        "token_value",
        "credential_value",
        "secret_value",
    ]
    forbidden_hits = [term for term in forbidden_payload_terms if term in method.lower()]
    if forbidden_hits:
        raise AssertionError(f"service import method must not collect secret material: {forbidden_hits}")

    required_panel_terms = [
        "읽기 전용 서비스 결과 가져오기",
        "능동 스캔은 실행하지 않습니다",
        "secret 값은 입력하지 않고",
        "Evidence 후보",
    ]
    missing_panel_terms = [term for term in required_panel_terms if term not in panel]
    if missing_panel_terms:
        raise AssertionError(f"missing service import panel terms: {missing_panel_terms}")

    required_result_terms = [
        "active_scan_executed",
        "secret_material_stored",
        "trusted_as_instruction",
        "serviceImportNormalized.parser_report?.parsed_item_count",
    ]
    missing_result_terms = [term for term in required_result_terms if term not in redteam2_panel]
    if missing_result_terms:
        raise AssertionError(f"missing service import result terms: {missing_result_terms}")

    print("[+] RedTeam2 frontend scanner service import contract passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
