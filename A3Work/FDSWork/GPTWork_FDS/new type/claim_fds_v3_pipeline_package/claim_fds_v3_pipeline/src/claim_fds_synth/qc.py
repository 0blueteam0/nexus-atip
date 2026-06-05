from __future__ import annotations

from typing import Dict, List
from .claim_data import ClaimCase
from .layout import LayoutAudit


def validate_medical_receipt_semantics(claim: ClaimCase) -> Dict[str, object]:
    s = claim.summary
    expected_total = s["covered_partial_patient_total"] + s["covered_corporation_total"] + s["full_patient_total"] + s["noncovered_total"]
    expected_corp = s["covered_corporation_total"] + s.get("cap_excess", 0)
    expected_patient = (s["covered_partial_patient_total"] - s.get("cap_excess", 0)) + s["full_patient_total"] + s["noncovered_total"]
    expected_due = s["patient_burden_total"] - s["prepaid_amount"]
    expected_paid = s["paid_by_card"] + s["paid_by_cash_receipt"] + s["paid_by_cash"]
    expected_unpaid = s["amount_due"] - s["paid_total"]
    checks = {
        "total_medical_fee_matches_components": s["total_medical_fee"] == expected_total,
        "insurer_corporation_total_matches": s["insurer_corporation_total"] == expected_corp,
        "patient_burden_total_matches": s["patient_burden_total"] == expected_patient,
        "amount_due_matches": s["amount_due"] == expected_due,
        "paid_total_matches": s["paid_total"] == expected_paid,
        "unpaid_amount_matches": s["unpaid_amount"] == expected_unpaid,
    }
    return {
        "checks": checks,
        "all_pass": all(checks.values()),
        "expected": {
            "total_medical_fee": expected_total,
            "insurer_corporation_total": expected_corp,
            "patient_burden_total": expected_patient,
            "amount_due": expected_due,
            "paid_total": expected_paid,
            "unpaid_amount": expected_unpaid,
        },
        "actual": {k: s[k] for k in ["total_medical_fee", "insurer_corporation_total", "patient_burden_total", "amount_due", "paid_total", "unpaid_amount"]},
    }


def audit_layout(audit: LayoutAudit, max_truncated: int = 8) -> Dict[str, object]:
    d = audit.as_dict()
    d["pass"] = d["overflow_count"] == 0 and d["truncated_count"] <= max_truncated
    d["max_truncated_allowed"] = max_truncated
    return d


def field_coverage_report(field_bboxes: Dict[str, tuple], must_have: List[str]) -> Dict[str, object]:
    missing = [k for k in must_have if k not in field_bboxes]
    return {"covered_count": len(must_have) - len(missing), "required_count": len(must_have), "missing": missing, "pass": not missing}
