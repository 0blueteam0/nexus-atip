from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
COMPLETION_AUDIT = ROOT / "고도화" / "completion-audit"
REVIEW_JSON = COMPLETION_AUDIT / "redteam_ax_development_byproduct_exclusion_review.json"
REVIEW_MD = COMPLETION_AUDIT / "REDTEAM_AX_DEVELOPMENT_BYPRODUCT_EXCLUSION_REVIEW.md"
MATRIX = COMPLETION_AUDIT / "redteam_ax_completion_audit_matrix.json"


def main() -> int:
    if not REVIEW_JSON.exists():
        raise AssertionError(f"missing byproduct exclusion review json: {REVIEW_JSON}")
    if not REVIEW_MD.exists():
        raise AssertionError(f"missing byproduct exclusion review markdown: {REVIEW_MD}")
    if not MATRIX.exists():
        raise AssertionError(f"missing completion audit matrix: {MATRIX}")

    review = json.loads(REVIEW_JSON.read_text(encoding="utf-8"))
    matrix = json.loads(MATRIX.read_text(encoding="utf-8"))
    if review.get("kind") != "redteam_ax_development_byproduct_exclusion_review":
        raise AssertionError("unexpected review kind")
    if review.get("status") != "passed":
        raise AssertionError("byproduct exclusion review must pass")
    if review.get("matrix_goal_status") != "active_incomplete":
        raise AssertionError("review must not mark the overall goal complete")
    summary = review.get("summary") or {}
    if summary.get("development_byproduct_ref_count", 0) <= 0:
        raise AssertionError("review must identify at least one development byproduct ref")
    if summary.get("completion_eligible_byproduct_ref_count") != 0:
        raise AssertionError("development byproducts must not be completion evidence")
    if summary.get("report_claim_eligible_byproduct_ref_count") != 0:
        raise AssertionError("development byproducts must not be report claim evidence")
    policy = review.get("policy") or {}
    if not policy.get("development_byproducts_must_not_prove_final_completion"):
        raise AssertionError("missing final completion exclusion policy")
    if not policy.get("development_byproducts_must_not_support_report_claims"):
        raise AssertionError("missing report claim exclusion policy")

    rows = review.get("review_rows") or []
    byproduct_rows = [row for row in rows if row.get("is_development_byproduct")]
    if not all(row.get("allowed_use") == "contract_regression_or_safety_control_evidence_only" for row in byproduct_rows):
        raise AssertionError("all byproduct rows must be contract/safety evidence only")
    if not all(row.get("completion_evidence_allowed") is False for row in byproduct_rows):
        raise AssertionError("all byproduct rows must be completion-evidence denied")
    if not all(row.get("report_claim_evidence_allowed") is False for row in byproduct_rows):
        raise AssertionError("all byproduct rows must be report-claim denied")

    comp50 = next((item for item in matrix.get("audit_items", []) if item.get("id") == "RTA-COMP-050"), None)
    if not comp50:
        raise AssertionError("matrix missing RTA-COMP-050")
    if comp50.get("status") != "proved":
        raise AssertionError("RTA-COMP-050 must be proved after exclusion review exists")
    refs = comp50.get("evidence_refs") or []
    if REVIEW_JSON.as_posix() not in refs or REVIEW_MD.as_posix() not in refs:
        raise AssertionError("RTA-COMP-050 must cite review JSON and Markdown artifacts")
    text = REVIEW_MD.read_text(encoding="utf-8")
    required_terms = [
        "개발 부산물",
        "완료 증거로 허용된 개발 부산물 ref: 0",
        "보고서 Claim 증거로 허용된 개발 부산물 ref: 0",
        "계약·회귀·안전통제 증거로만 사용",
    ]
    missing = [term for term in required_terms if term not in text]
    if missing:
        raise AssertionError(f"review markdown missing required terms: {missing}")
    print("[+] development byproduct exclusion review sanity passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
