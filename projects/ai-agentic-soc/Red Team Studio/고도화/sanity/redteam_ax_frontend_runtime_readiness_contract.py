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
        "운영 산출물 manifest builder API",
        "/api/redteam/v2/toolchains/build-artifact-manifest",
        "운영 산출물 폴더에서 scanner 결과 파일을 찾아 SHA-256 manifest를 만들고 명령은 실행하지 않습니다",
        "운영 산출물 manifest import API",
        "/api/redteam/v2/toolchains/import-artifact-manifest",
        "source_path와 sha256을 검증해 Nuclei/OpenVAS/Trivy/SCA/npm audit/ZAP 결과 파일을 한 collection으로 가져옵니다",
        "복합 Evidence 후보 승인 API",
        "/api/redteam/v2/toolchain-result-collections/{collection_id}/approve-evidence",
        "레드팀 리드 또는 통제팀이 후보 Evidence를 승인해야 Finding 승격과 Matrix 준비로 이동",
        "승인 버튼은 후보 Evidence만 승인하며",
        "Finding 생성·severity 승인·보고서 반영은 별도 단계로 남깁니다",
        "복합 Finding 초안 생성 API",
        "/api/redteam/v2/toolchain-result-collections/{collection_id}/promote-findings",
        "승인된 Evidence만 pending review Finding 초안으로 만들며",
        "severity 2인 승인과 보고서 Claim 반영은 계속 별도 단계입니다",
        "복합 Finding 심각도 2인 승인 API",
        "/api/redteam/v2/toolchain-result-collections/{collection_id}/approve-finding-severity",
        "collection에서 만든 Finding 초안만 red_team_lead와 business_owner가 함께 승인하며",
        "Matrix와 보고서 검증은 다음 단계로 남깁니다",
        "복합 Collection Matrix 초안 API",
        "/api/redteam/v2/toolchain-result-collections/{collection_id}/matrix-draft",
        "승인된 Evidence와 2인 승인 Finding만 ready row로 구성하며",
        "held row는 보고서 입력에서 제외합니다",
        "복합 Collection Report v2 draft API",
        "/api/redteam/v2/toolchain-result-collections/{collection_id}/matrix-draft/report-draft",
        "Matrix ready와 report gate pass일 때만 한국어 Report v2 draft를 생성하고",
        "최종 export 승인은 별도로 남깁니다",
        "복합 Collection 최종 export 게이트",
        "/api/redteam/v2/reports/{report_id}/approve-export",
        "/api/redteam/v2/reports/{report_id}/export",
        "collection Report v2 draft의 report_id가 자동으로 최종 게이트 패널에 연결됩니다",
        "복합 Collection E2E 완료 게이트",
        "/api/redteam/v2/toolchain-result-collections/{collection_id}/completion-gate",
        "Evidence 승인, Finding 승격, 2인 severity 승인, Matrix ready, Report gate, export 완료를 기존 산출물로만 점검합니다",
        "운영 산출물 전체 닫기 API",
        "/api/redteam/v2/toolchains/close-operating-artifact-manifest-e2e",
        "운영 scanner 폴더를 manifest로 만들고 가져오기, 결과 회수, close-e2e를 이어서 수행하되 scanner 명령은 실행하지 않습니다",
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
        "저장된 stdout/stderr 또는 운영자 첨부 결과만 읽고",
        "Sanitizer와 도구별 LLM normalizer를 거친 뒤 Evidence Card 후보를 만듭니다",
        "여러 분석도구 순차 실행·결과 첨부",
        "운영자 결과 첨부 - 명령 실행 없음",
        "승인된 로컬 runner 실행",
        "Nuclei/OpenVAS/Trivy/SCA/npm audit/ZAP 결과를 첨부합니다",
        "첨부 모드는 도구 명령을 실행하지 않고 저장된 결과만 untrusted artifact로 기록합니다",
        "운영자 결과 본문",
        "---REDTEAM-AX-TOOL---",
        "여러 도구 결과 첨부",
        "운영 산출물 manifest 만들기·가져오기",
        "운영 산출물 manifest builder는 폴더 안의 scanner 결과 파일을 찾아 SHA-256을 계산합니다",
        "운영 산출물 폴더 경로",
        "폴더에서 manifest 만들기",
        "운영 산출물 manifest 가져오기",
        "운영 산출물 manifest는 source_path와 sha256을 확인한 뒤",
        "도구 명령·능동 스캔은 실행하지 않고 검증된 파일만 toolchain collection으로 연결합니다",
        "복합 Collection 전체 닫기 API",
        "/api/redteam/v2/toolchain-result-collections/{collection_id}/close-e2e",
        "운영 산출물 전체 닫기 API",
        "/api/redteam/v2/toolchains/close-operating-artifact-manifest-e2e",
        "명시된 사람 승인자 정보를 받아 Evidence 승인, Finding 승격, 2인 severity 승인, Matrix, Report v2 draft, export 승인, export, completion gate를 순서대로 수행하지만 scanner 명령과 능동 스캔은 실행하지 않습니다",
        "전체 닫기용 운영 scanner 산출물 폴더",
        "운영 산출물 전체 닫기",
        "복합 Collection 전체 닫기 승인자",
        "사람 승인 필드가 비어 있으면 실행하지 않습니다",
        "전체 닫기: 승인·보고서·Export",
    ]
    missing_safety_terms = [term for term in required_safety_terms if term not in redteam2_panel]
    if missing_safety_terms:
        raise AssertionError(f"missing runtime readiness safety terms: {missing_safety_terms}")

    print("[+] RedTeam2 frontend runtime readiness contract passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
