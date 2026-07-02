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
        "Finding/Claim 검토 패키지",
        "보류된 Finding/Claim 후보",
        "복합 도구 결과 회수 API",
        "/api/redteam/v2/toolchains/{toolchain_id}/collect-results",
        "저장된 stdout/stderr만 읽어 Sanitizer, 도구별 LLM normalizer, Evidence Card 후보 생성을 순서대로 수행",
        "Finding 초안 생성 API",
        "/api/redteam/v2/tool-result-finding-claim-review/{candidate_id}/promote-finding",
        "Finding 초안 생성 API는 Evidence 승인 후에만 /api/redteam/v2/tool-result-finding-claim-review/{candidate_id}/promote-finding API로 사용할 수 있고",
        "Claim-Evidence Matrix 초안 API",
        "/api/redteam/v2/tool-result-finding-claim-review/matrix-draft",
        "승인된 Evidence와 2인 severity 승인된 Finding만 보고서 검증 payload에 포함",
        "held row는 Evidence/Finding 승인 전 보류",
        "Matrix 기반 Report v2 draft API",
        "/api/redteam/v2/tool-result-finding-claim-review/matrix-draft/report-draft",
        "held row 0건과 report gate pass일 때만 한국어 Report v2 draft 생성",
        "export 전 최종 사람 승인은 별도로 필요",
        "운영자 조치 runbook 단계",
        "운영자 증거 수집 패키지",
        "운영자 제출 증거 검증",
        "Evidence Card 후보 import 계획",
        "아래 단계는 사람이 순서대로 수행",
        "Evidence Card 후보로 첨부",
        "Evidence Card 후보 payload",
        "Claim-Evidence Matrix 연결 전 사람 검토",
        "도구 재실행·능동 스캔·Finding 확정은 사람이 승인",
        "승인 전에는 Finding이나 보고서 Claim으로 확정하지 않습니다",
        "Finding severity 2인 승인 전에는 보고서에 자동 삽입하지 않습니다",
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
        "tool_result_finding_claim_review",
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
