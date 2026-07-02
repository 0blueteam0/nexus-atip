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
    loader = _segment(source, "  async loadRedTeam2AnalysisStatus() {", "  async submitRedTeam2ToolActionPlan")
    panel = _segment(source, "      smallPanel('실행 환경 준비도 / 남은 실측 조건'", "      smallPanel('도구 실행 계획 / 샌드박스 정책'")
    redteam2_panel = _segment(source, "  redTeamAnalysis2Panel() {", "  redTeamAnalysisPanel() {")

    required_loader_terms = [
        "/api/redteam/v2/runtime-readiness",
        "runtimeReadinessRes",
        "runtimeReadiness:runtimeReadinessRes.ok",
    ]
    missing_loader_terms = [term for term in required_loader_terms if term not in loader]
    if missing_loader_terms:
        raise AssertionError(f"missing runtime readiness loader terms: {missing_loader_terms}")

    required_panel_terms = [
        "실행 환경 준비도 / 남은 실측 조건",
        "실제 실행 버튼이 막히는 이유",
        "Docker Desktop daemon",
        "WSL 실행 환경",
        "WSL 배포판",
        "실측 승격 게이트",
        "승격 gate 결과",
        "조치 runbook",
        "남은 조치 단계",
        "증거 수집 패키지",
        "수집할 증거 항목",
        "증거 제출 검증",
        "승인된 제출 증거",
        "Evidence Card 후보 계획",
        "Evidence Card 후보 수",
        "도구 결과 LLM 분석 브리프",
        "분석 가능한 도구 근거",
        "LLM 분석 에이전트",
        "운영자 조치 runbook 단계",
        "운영자 증거 수집 패키지",
        "운영자 제출 증거 검증",
        "Evidence Card 후보 import 계획",
        "아래 단계는 사람이 순서대로 수행",
        "Evidence Card 후보로 첨부",
        "Evidence Card 후보 payload",
        "Claim-Evidence Matrix 연결 전 사람 검토",
        "도구 재실행·능동 스캔·Finding 확정은 사람이 승인",
        "제출 manifest의 artifact path",
        "sha256",
        "사람 승인 상태",
        "secret 값을 수집하지 않습니다",
        "상태 조회 API는 이 명령을 대신 실행하지 않습니다",
        "Docker Desktop daemon 준비",
        "OpenVAS/ZAP read-only endpoint와 vault reference 설정",
        "담당/차단/확인",
        "조직 OpenVAS/ZAP read-only report endpoint",
        "외부 vault reference",
        "실서비스 가져오기",
        "조직 endpoint import 미실행",
        "런타임 상태 새로고침",
    ]
    missing_panel_terms = [term for term in required_panel_terms if term not in panel]
    if missing_panel_terms:
        raise AssertionError(f"missing runtime readiness panel terms: {missing_panel_terms}")

    required_safety_terms = [
        "commands_executed_by_api",
        "active_scan_executed",
        "trusted_as_instruction",
        "external_scanner_service_import_live",
        "wsl_runtime",
        "strict_live_readiness_promotion",
        "live_readiness_remediation",
        "operator_evidence_collection",
        "operator_evidence_submission",
        "operator_evidence_card_import_plan",
        "tool_result_analysis_brief",
        "llm_raw_tool_output_trusted",
        "commands_executed_by_package",
        "secret_material_collected",
        "상태 조회 API는 Docker나 scanner를 실행하지 않음",
        "항상 아니오 유지",
    ]
    missing_safety_terms = [term for term in required_safety_terms if term not in redteam2_panel]
    if missing_safety_terms:
        raise AssertionError(f"missing runtime readiness safety terms: {missing_safety_terms}")

    print("[+] RedTeam2 frontend runtime readiness contract passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
