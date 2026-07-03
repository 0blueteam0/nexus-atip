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
        "sixToolWorkOrderRows",
        "sixToolSubmissionTemplateRows",
        "redteam2SixToolWorkOrderState",
        "redteam2SixToolSubmissionTemplateState",
        "분석도구",
        "버튼",
        "실행 상태",
        "차단 사유",
        "사용자 안내",
        "연결 API",
        "6개 도구 작업 순서 만들기",
        "6개 도구 제출 양식 만들기",
        "작업 순서",
        "제출 항목",
        "예상 파일명",
        "필요 입력",
        "launch-readiness API 응답 없음",
        "상태 새로고침을 먼저 누르세요",
    ]
    missing = [term for term in required_terms if term not in source]
    if missing:
        raise AssertionError(f"missing RedTeam2 launch readiness contract terms: {missing}")
    print("[+] RedTeam2 launch readiness frontend contract passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
