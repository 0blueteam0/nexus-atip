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


def main() -> int:
    source = REPORTS_JS.read_text(encoding="utf-8")
    required_terms = [
        "/api/redteam/v2/toolchains/launch-readiness",
        "/api/redteam/v2/toolchains/six-tool-work-order",
        "/api/redteam/v2/toolchains/six-tool-submission-template",
        "launchReadinessRes",
        "launchReadinessRows",
        "launchButtons",
        "buildRedTeam2SixToolWorkOrder",
        "buildRedTeam2SixToolSubmissionTemplate",
        "safeSmokeToolCatalog",
        "TOOL-OPENVAS-001':{ runner_argv:['gvm-cli', '--version'], execution_mode:'dry_run'",
        "TOOL-ZAP-001':{ runner_argv:['zap-cli', '--version'], execution_mode:'dry_run'",
        "TOOL-SCA-001':{ import_only:true",
        "Nuclei/OpenVAS/Trivy/npm audit/OWASP ZAP의 버전 확인",
        "SCA는 결과 첨부 도구",
        "sixToolWorkOrderRows",
        "sixToolSubmissionTemplateRows",
        "redteam2SixToolWorkOrderState",
        "redteam2SixToolSubmissionTemplateState",
        "analystReadinessSummary",
        "operatorEnvironmentSummary",
        "analystReadinessRows",
        "operatorEnvironmentRows",
        "toolchainAnalystProgress",
        "toolchainAnalystProgressRows",
        "toolchainAnalystStageRows",
        "serviceImportAnalystProgress",
        "serviceImportAnalystProgressRows",
        "serviceImportAnalystStageRows",
        "operatingClosureProgress",
        "operatingClosureProgressRows",
        "operatingClosureProgressStageRows",
        "분석가 안내",
        "분석가 진행 요약",
        "서비스 가져오기 진행",
        "서비스 다음 단계",
        "운영 closure 진행 요약",
        "운영 closure 단계",
        "진행 단계",
        "다음 버튼",
        "관리자 환경 단계",
        "분석가 기본 화면에서 숨김",
        "분석도구",
        "버튼",
        "실행 상태",
        "차단 사유",
        "사용자 안내",
        "연결",
        "6개 도구 작업 순서 만들기",
        "6개 도구 제출 양식 만들기",
        "작업 순서",
        "제출 항목",
        "예상 파일명",
        "필요 입력",
        "실행 준비 응답 없음",
        "상태 새로고침을 먼저 누르세요",
        "세부 위치는 관리자/감사 기록에서 확인",
        "경로는 관리자 감사 기록에서 확인",
        "운영 산출물 묶음 만들기",
        "관리자가 승인한 운영 산출물 폴더",
        "서비스 결과 원본은 분석 저장소에 보관됨",
    ]
    forbidden_terms = [
        "stored: ${",
        "plan: ${",
        "run: ${",
        "report: ${",
        "export: ${",
        "allow_safe_local_smoke_when_runtime_partial ·",
        "source_path\":\"J:/PortableApps",
        "artifact_path\":\"J:/PortableApps",
        "endpoint URL을 입력하세요",
    ]
    missing = [term for term in required_terms if term not in source]
    if missing:
        raise AssertionError(f"missing RedTeam2 launch readiness contract terms: {missing}")
    present_forbidden = [term for term in forbidden_terms if term in source]
    if present_forbidden:
        raise AssertionError(f"forbidden RedTeam2 raw analyst exposure terms present: {present_forbidden}")
    print("[+] RedTeam2 launch readiness frontend contract passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
