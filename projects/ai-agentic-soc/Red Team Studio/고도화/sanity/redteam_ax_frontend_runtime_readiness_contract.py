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
    panel = _segment(source, "      smallPanel('분석가용 다음 실행 안내'", "      smallPanel('도구 실행 계획 / 샌드박스 정책'")
    redteam2_panel = _segment(source, "  redTeamAnalysis2Panel() {", "  redTeamAnalysisPanel() {")

    required_loader_terms = [
        "/api/redteam/v2/runtime-readiness",
        "/api/redteam/v2/toolchains/launch-readiness",
        "runtimeReadinessRes",
        "launchReadinessRes",
        "runtimeReadiness:runtimeReadinessRes.ok",
        "launchReadiness:launchReadinessRes.ok",
    ]
    missing_loader_terms = [term for term in required_loader_terms if term not in loader]
    if missing_loader_terms:
        raise AssertionError(f"missing runtime readiness loader terms: {missing_loader_terms}")
    if "require_runtime_preflight" not in source:
        raise AssertionError("missing governed execution runtime preflight payload term")
    for payload_term in (
        "require_real_completion_evidence",
        "completion_evidence_allowed",
        "source_completion_review",
    ):
        if payload_term not in source:
            raise AssertionError(f"missing operating closure strict evidence payload term: {payload_term}")

    required_panel_terms = [
        "분석가용 다음 실행 안내",
        "분석가는 결과 첨부, Evidence 후보 확인, 보고서 주장 검토 순서로 진행합니다",
        "분석 환경 설정(관리자용)",
        "6개 도구 작업 순서 만들기",
        "6개 도구 제출 양식 만들기",
        "운영 증거 제출 manifest 초안",
        "결과 회수·Evidence 후보",
        "아래 단계는 사람이 순서대로 수행",
        "Evidence Card 후보로 첨부",
        "Claim-Evidence Matrix 연결 전 사람 검토",
        "도구 재실행·능동 스캔·Finding 확정은 사람이 승인",
        "승인 전에는 Finding이나 보고서 Claim으로 확정하지 않습니다",
        "사람 승인 상태",
        "secret 값을 수집하지 않습니다",
        "실서비스 가져오기",
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
        "항상 아니오 유지",
        "Sanitizer와 도구별 LLM normalizer를 거친 뒤 Evidence Card 후보를 만듭니다",
        "분석 결과 수집·검토 워크플로우",
        "이 영역의 목적은 실행 목록을 보여주는 것이 아니라",
        "분석 결과 수집·검토",
        "상세 실행 기록(관리자/감사용)",
        "결과 수집 상태",
        "결과 정리 상태",
        "승인된 분석 실행 시작",
        "진행률",
        "다음 행동",
        "상세 진행 기록(관리자/감사용)",
        "사용자 안내",
        "결과가 준비되면 회수·Evidence 후보 단계와 검토 우선순위가 표시됩니다",
        "LLM 분석 에이전트 요약",
        "증거 사용 제한",
        "결과 회수 뒤 표시됩니다",
        "도구별 normalizer와 Evidence 사용 제한을 표시",
        "분석 결과 쉬운 요약",
        "확인 후보",
        "심각도 분포",
        "도구별 분석 요약",
        "검토 우선순위",
        "세부 실행 ID와 저장 위치는 관리자 감사 기록과 Evidence Card에서 추적합니다",
        "analyst_finding_review_summary",
        "필수 6개 도구 coverage",
        "필수 6개 분석도구",
        "completion_gate_ready",
        "required_analysis_tool_coverage",
        "missing_required_tool_ids",
        "Nuclei/OpenVAS/Trivy/SCA/npm audit/ZAP 6개 coverage",
        "완료 게이트 미준비",
        "CycloneDX SBOM",
        "컴포넌트 인벤토리 Evidence",
        "취약점 후보 Evidence",
        "affects 연결은 사람이 검토하기 전 Claim으로 확정하지 않습니다",
        "운영자 결과 첨부 - 명령 실행 없음",
        "승인된 로컬 runner 실행",
        "운영자 결과 본문",
        "---REDTEAM-AX-TOOL---",
        "여러 도구 결과 첨부",
        "운영 산출물 폴더 경로",
        "폴더에서 manifest 만들기",
        "운영 산출물 manifest 가져오기",
        "도구 명령·능동 스캔은 실행하지 않고 검증된 파일만 toolchain collection으로 연결합니다",
        "운영 closure 준비 요약",
        "/api/redteam/v2/toolchains/operating-closure-readiness-summary",
        "/api/redteam/v2/toolchains/{toolchain_id}/run-status",
        "저장 실행 상태 다시 불러오기",
        "저장 실행 상태",
        "저장 실행 단계",
        "상태 조회 API는 저장된 실행 기록만 읽고 명령을 실행하지 않음",
        "toolchain_run_status_loaded",
        "can_collect_results",
        "collectable_step_count",
        "운영 closure 다음 단계",
        "운영 closure 사람 검토 기록 가능",
        "ready_for_operating_closure_human_review",
        "does_not_mark_goal_complete",
        "필수 분석도구 산출물",
        "Nuclei/OpenVAS/Trivy/SCA/npm audit/ZAP 6개 결과 파일을 점검합니다",
        "필수 6개 분석도구 산출물 전체를 같은 폴더에 준비",
        "누락 도구",
        "예상 파일명 패턴",
        "missing_tool_remediation",
        "expected_filename_patterns",
        "6개 결과가 모두 필요",
        "다음 실행 준비 단계",
        "화면 버튼",
        "도구 실행 가능 여부",
        "도구 실행 전 해결 필요",
        "runtime_preflight_status",
        "실행 전 준비 차단",
        "tool_execution_blocked_by",
        "safe_local_smoke_partial_runtime_preflight",
        "executeRedTeam2SafeLocalSmokeToolchain",
        "안전 설치 확인 smoke",
        "frontend_action_key",
        "redteam2_button_ko",
        "next_action_plan",
        "/api/redteam/v2/toolchains/operator-evidence-submission-manifest-draft",
        "개발 부산물 제외",
        "사람 검토 기록으로 체크리스트와 승인자 서명을 남긴 뒤 전체 닫기를 실행",
        "운영 closure 제출 패키지 확인",
        "실제 운영 증거 사전 점검",
        "준비 요약 중",
        "운영 closure 준비 요약",
        "운영 증거 제출 manifest 초안",
        "운영 Evidence Card 후보 import",
        "운영 Evidence Card import",
        "Evidence Card 후보 ID 선택",
        "사람 검토를 완료했으며 생성된 Evidence Card를 바로 승인 기록으로 남김",
        "운영 closure 사람 검토 기록",
        "검토 완료 운영 closure 실행",
        "운영 closure 증거 인증",
        "운영 completion audit 검토",
        "전체 목표 완료 검토",
        "운영 closure 증거 검사",
        "운영 closure 실측 attestation",
        "운영 completion audit checklist",
        "전체 목표 완료 checklist",
        "운영 closure 제출 항목",
        "운영 closure 승인자",
        "운영 closure 사람 검토",
        "운영 closure 서명",
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
