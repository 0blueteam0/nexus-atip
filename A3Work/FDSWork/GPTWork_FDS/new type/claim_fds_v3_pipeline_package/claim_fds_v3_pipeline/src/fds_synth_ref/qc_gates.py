"""Quality gates for generated claim document datasets."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from .privacy_transform import leak_scan

CRITICAL_FIELDS = {
    "patient_name_or_pseudonym",
    "patient_registration_no",
    "treatment_period_or_date",
    "receipt_no",
    "total_medical_fee_6__formula_1_2_3_4",
    "patient_burden_total_8__formula_1_minus_5_plus_3_4",
    "amount_due_10__formula_8_minus_9",
    "paid_total_11",
    "issue_date",
}


def assert_layout_qc(qc: dict[str, Any]) -> list[str]:
    failures: list[str] = []
    for name, block in qc.items():
        if isinstance(block, dict):
            if block.get("overflow_count", 0) != 0:
                failures.append(f"{name}: overflow_count must be 0")
            truncated = set(block.get("truncated_fields", []))
            bad = sorted(CRITICAL_FIELDS & truncated)
            if bad:
                failures.append(f"{name}: critical fields truncated: {bad}")
    return failures


def assert_privacy_qc(manifest_text: str, known_provider_blacklist: list[str] | None = None) -> list[str]:
    findings = leak_scan(manifest_text, known_provider_blacklist=known_provider_blacklist)
    return [f"privacy leakage candidate: {x}" for x in findings]


def validate_manifest_file(path: str | Path) -> list[str]:
    text = Path(path).read_text(encoding="utf-8")
    failures = assert_privacy_qc(text)
    data = json.loads(text)
    docs = data if isinstance(data, list) else [data]
    for doc in docs:
        if doc.get("source") != "synthetic" and doc.get("privacy_state") not in {"pseudonymized", "anonymized", "synthetic_only"}:
            failures.append(f"{doc.get('doc_id')}: invalid privacy_state")
        if doc.get("labels", {}).get("doc_label") == "tampered" and not doc.get("labels", {}).get("reason_codes"):
            failures.append(f"{doc.get('doc_id')}: tampered doc missing reason_codes")
    return failures
