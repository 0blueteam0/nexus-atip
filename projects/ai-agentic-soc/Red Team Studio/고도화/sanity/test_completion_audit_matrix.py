from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
MATRIX = ROOT / "고도화" / "completion-audit" / "redteam_ax_completion_audit_matrix.json"
MATRIX_MD = ROOT / "고도화" / "completion-audit" / "REDTEAM_AX_COMPLETION_AUDIT_MATRIX.md"

REQUIRED_IDS = {
    "RTA-COMP-001",
    "RTA-COMP-002",
    "RTA-COMP-003",
    "RTA-COMP-004",
    "RTA-COMP-005",
    "RTA-COMP-006",
    "RTA-COMP-007",
    "RTA-COMP-008",
    "RTA-COMP-009",
    "RTA-COMP-010",
    "RTA-COMP-011",
    "RTA-COMP-012",
    "RTA-COMP-013",
    "RTA-COMP-014",
    "RTA-COMP-015",
    "RTA-COMP-016",
    "RTA-COMP-050",
}

REQUIRED_TERMS = [
    "레드팀 분석2",
    "ToolActionCard",
    "Evidence Card",
    "Claim-Evidence Matrix",
    "Nuclei",
    "OpenVAS",
    "Trivy",
    "SCA",
    "npm audit",
    "OWASP ZAP",
    "Agentic RAG",
    "unsupported claim",
    "unapproved high-risk",
    "evidence-less Finding",
    "Development byproducts",
    "completion_evidence_allowed=false",
    "report_claim_evidence_allowed=false",
]


def _load_matrix() -> dict:
    if not MATRIX.exists():
        raise AssertionError(f"missing completion audit matrix: {MATRIX}")
    return json.loads(MATRIX.read_text(encoding="utf-8"))


def _assert_existing_evidence_refs(item: dict) -> None:
    for ref in item.get("evidence_refs", []):
        path = Path(ref)
        if path.anchor and not path.exists():
            raise AssertionError(f"{item['id']} evidence ref does not exist: {ref}")


def main() -> int:
    matrix = _load_matrix()
    if not MATRIX_MD.exists():
        raise AssertionError(f"missing completion audit markdown: {MATRIX_MD}")
    if matrix.get("kind") != "redteam_ax_completion_audit_matrix":
        raise AssertionError("unexpected matrix kind")
    if matrix.get("goal_status") != "active_incomplete":
        raise AssertionError("matrix must not mark the full goal complete while unresolved items remain")

    items = matrix.get("audit_items") or []
    ids = {item.get("id") for item in items}
    missing_ids = sorted(REQUIRED_IDS - ids)
    if missing_ids:
        raise AssertionError(f"missing audit item ids: {missing_ids}")

    statuses = {item.get("status") for item in items}
    if "proved" not in statuses:
        raise AssertionError("matrix must contain proved items")
    if not statuses.intersection({"partial", "gap", "blocked", "unverified"}):
        raise AssertionError("matrix must preserve unresolved statuses until the goal is fully proven")

    text = json.dumps(matrix, ensure_ascii=False)
    missing_terms = [term for term in REQUIRED_TERMS if term not in text]
    if missing_terms:
        raise AssertionError(f"matrix missing required terms: {missing_terms}")

    for item in items:
        if not item.get("requirement"):
            raise AssertionError(f"{item.get('id')} missing requirement")
        if not item.get("proof_summary"):
            raise AssertionError(f"{item.get('id')} missing proof_summary")
        if not item.get("evidence_refs"):
            raise AssertionError(f"{item.get('id')} missing evidence_refs")
        _assert_existing_evidence_refs(item)

    comp50 = next((item for item in items if item.get("id") == "RTA-COMP-050"), None)
    if not comp50:
        raise AssertionError("matrix missing RTA-COMP-050")
    if comp50.get("status") != "proved":
        raise AssertionError("RTA-COMP-050 must be proved once the byproduct exclusion review exists")
    comp50_text = json.dumps(comp50, ensure_ascii=False)
    required_comp50_terms = [
        "development byproduct exclusion review",
        "completion_evidence_allowed=false",
        "report_claim_evidence_allowed=false",
        "contract_regression_or_safety_control_evidence_only",
    ]
    missing_comp50_terms = [term for term in required_comp50_terms if term not in comp50_text]
    if missing_comp50_terms:
        raise AssertionError(f"RTA-COMP-050 missing required terms: {missing_comp50_terms}")

    print("[+] completion audit matrix sanity passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
