from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
MODEL = ROOT / "runtime" / "redteam_v2_models.py"
REPORTS_JS = (
    ROOT
    / "soc-frontend-vite-react"
    / "soc-frontend"
    / "idiomatic-react"
    / "src"
    / "store"
    / "methods"
    / "reports.js"
)


def main() -> int:
    model = MODEL.read_text(encoding="utf-8")
    frontend = REPORTS_JS.read_text(encoding="utf-8")
    required_model_terms = [
        "analyst_finding_review_summary",
        "_toolchain_analyst_finding_review_summary",
        "raw_paths_hidden_from_analyst",
        "traceability_note_ko",
        "high_or_critical_candidate_count",
        "승인 전에는 Finding/Report Claim으로 확정하지 않습니다",
        "세부 실행 ID와 저장 위치는 관리자 감사 기록과 Evidence Card에서 추적합니다",
    ]
    required_frontend_terms = [
        "toolchainAnalystFindingReview",
        "analystFindingReviewRows",
        "analystFindingMissingRows",
        "분석 결과 쉬운 요약",
        "심각도 분포",
        "보관 근거",
        "보관된 실행 기록 있음",
        "도구별 분석 요약",
        "검토 우선순위",
    ]
    missing_model = [term for term in required_model_terms if term not in model]
    missing_frontend = [term for term in required_frontend_terms if term not in frontend]
    if missing_model:
        raise AssertionError(f"missing backend analyst summary contract terms: {missing_model}")
    if missing_frontend:
        raise AssertionError(f"missing frontend analyst summary terms: {missing_frontend}")
    print("[+] RedTeam AX toolchain collection analyst summary contract passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
