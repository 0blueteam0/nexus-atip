from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
COMPLETION_AUDIT = ROOT / "고도화" / "completion-audit"
MATRIX = COMPLETION_AUDIT / "redteam_ax_completion_audit_matrix.json"
ARTIFACT_JSON = COMPLETION_AUDIT / "redteam_ax_development_byproduct_exclusion_review.json"
ARTIFACT_MD = COMPLETION_AUDIT / "REDTEAM_AX_DEVELOPMENT_BYPRODUCT_EXCLUSION_REVIEW.md"

BYPRODUCT_MARKERS = (
    "/archive/runs/",
    "/tests/",
    "/sanity/",
    "/fixtures/",
    "/fixture/",
    "CASE-V2-",
    "sample_e2e",
    "smoke",
    "test_",
    "operator-scanner-outputs",
)

REAL_OPERATING_REQUIRED_GATES = [
    "approved_case_scope",
    "roe_hitl_approval",
    "real_tool_output_or_approved_operator_import",
    "evidence_card_approval",
    "finding_severity_two_person_approval",
    "claim_evidence_matrix_ready",
    "korean_report_v2_export_gate_pass",
]


def now_utc() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def load_matrix() -> dict:
    if not MATRIX.exists():
        raise AssertionError(f"missing completion audit matrix: {MATRIX}")
    return json.loads(MATRIX.read_text(encoding="utf-8"))


def normalize_ref(ref: str) -> str:
    return ref.replace("\\", "/")


def is_development_byproduct(ref: str) -> bool:
    normalized = normalize_ref(ref)
    return any(marker in normalized for marker in BYPRODUCT_MARKERS)


def classify_ref(item: dict, ref: str) -> dict:
    normalized = normalize_ref(ref)
    byproduct = is_development_byproduct(normalized)
    return {
        "audit_item_id": item.get("id"),
        "audit_item_status": item.get("status"),
        "ref": normalized,
        "is_development_byproduct": byproduct,
        "allowed_use": "contract_regression_or_safety_control_evidence_only" if byproduct else "source_plan_or_operating_evidence_candidate",
        "completion_evidence_allowed": False if byproduct else None,
        "report_claim_evidence_allowed": False if byproduct else None,
        "exclusion_reason": (
            "Matches archive/test/sanity/fixture/smoke markers and cannot prove real operating closure."
            if byproduct
            else ""
        ),
    }


def build_review() -> dict:
    matrix = load_matrix()
    items = matrix.get("audit_items") or []
    classifications = [
        classify_ref(item, str(ref))
        for item in items
        for ref in item.get("evidence_refs", [])
    ]
    byproduct_refs = [row for row in classifications if row["is_development_byproduct"]]
    completion_eligible_byproduct_refs = [
        row for row in byproduct_refs if row.get("completion_evidence_allowed") is True
    ]
    report_claim_eligible_byproduct_refs = [
        row for row in byproduct_refs if row.get("report_claim_evidence_allowed") is True
    ]
    return {
        "kind": "redteam_ax_development_byproduct_exclusion_review",
        "schema_version": "0.1",
        "created_at": now_utc(),
        "source_matrix": MATRIX.as_posix(),
        "matrix_goal_status": matrix.get("goal_status"),
        "policy": {
            "development_byproducts_must_not_prove_final_completion": True,
            "development_byproducts_must_not_support_report_claims": True,
            "allowed_development_byproduct_use": "contract_regression_or_safety_control_evidence_only",
            "real_operating_required_gates": REAL_OPERATING_REQUIRED_GATES,
            "byproduct_markers": BYPRODUCT_MARKERS,
        },
        "summary": {
            "total_evidence_ref_count": len(classifications),
            "development_byproduct_ref_count": len(byproduct_refs),
            "completion_eligible_byproduct_ref_count": len(completion_eligible_byproduct_refs),
            "report_claim_eligible_byproduct_ref_count": len(report_claim_eligible_byproduct_refs),
            "non_byproduct_ref_count": len(classifications) - len(byproduct_refs),
        },
        "review_rows": classifications,
        "blocked_completion_claims": [
            "Do not use archive/runs, fixture, smoke, sanity, sample, or CASE-V2 artifacts as final operating completion evidence.",
            "Do not use development byproducts as Report v2 Claim evidence unless they are separately imported, approved, and matrix-linked through the real operating workflow.",
            "Keep goal_status active_incomplete until real six-tool operating evidence passes Evidence/Finding/Matrix/Report/export gates.",
        ],
        "status": "passed" if not completion_eligible_byproduct_refs and not report_claim_eligible_byproduct_refs else "failed",
    }


def write_markdown(review: dict) -> None:
    summary = review["summary"]
    rows = [
        "---",
        "title: RedTeam AX Development Byproduct Exclusion Review",
        "type: completion_audit_control",
        "status: " + review["status"],
        "created: " + review["created_at"],
        "source_path:",
        f"  - {review['source_matrix']}",
        "tags: [redteam-ax, completion-audit, development-byproduct, evidence-governance]",
        "---",
        "",
        "# RedTeam AX Development Byproduct Exclusion Review",
        "",
        "## 판정",
        "",
        f"- 상태: `{review['status']}`",
        f"- 전체 evidence ref: {summary['total_evidence_ref_count']}",
        f"- 개발 부산물 ref: {summary['development_byproduct_ref_count']}",
        f"- 완료 증거로 허용된 개발 부산물 ref: {summary['completion_eligible_byproduct_ref_count']}",
        f"- 보고서 Claim 증거로 허용된 개발 부산물 ref: {summary['report_claim_eligible_byproduct_ref_count']}",
        "",
        "## 운영 규칙",
        "",
        "- archive/runs, fixture, smoke, sanity, sample, CASE-V2 산출물은 계약·회귀·안전통제 증거로만 사용한다.",
        "- 실제 운영 완료 증거는 ROE/HITL, 실제 도구 결과 또는 승인된 operator import, Evidence Card 승인, Finding 2인 승인, Claim-Evidence Matrix, Report v2 export gate를 통과해야 한다.",
        "- 개발 부산물은 별도 실제 운영 workflow로 재수집·승인·matrix 연결되기 전까지 Report v2 Claim 근거가 아니다.",
        "",
        "## 차단된 완료 주장",
        "",
    ]
    rows.extend(f"- {item}" for item in review["blocked_completion_claims"])
    rows.extend(["", "## 개발 부산물 샘플", ""])
    for row in [item for item in review["review_rows"] if item["is_development_byproduct"]][:20]:
        rows.append(f"- `{row['audit_item_id']}`: `{row['ref']}` -> {row['allowed_use']}")
    ARTIFACT_MD.write_text("\n".join(rows) + "\n", encoding="utf-8")


def main() -> int:
    review = build_review()
    COMPLETION_AUDIT.mkdir(parents=True, exist_ok=True)
    ARTIFACT_JSON.write_text(json.dumps(review, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    write_markdown(review)
    if review["status"] != "passed":
        raise AssertionError("development byproduct exclusion review failed")
    print(
        "[+] development byproduct exclusion review passed "
        f"({review['summary']['development_byproduct_ref_count']} byproduct refs excluded)"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
