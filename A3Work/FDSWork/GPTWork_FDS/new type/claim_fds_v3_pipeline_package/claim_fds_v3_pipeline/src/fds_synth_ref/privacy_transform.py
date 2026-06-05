"""Pseudonymization/anonymization helpers for FDS synthetic document datasets.

This module is deliberately conservative. It does not retain raw values in output
manifests. It creates stable synthetic replacements that preserve cross-document
consistency while preventing direct disclosure of patient/provider identities.
"""
from __future__ import annotations

from dataclasses import dataclass
import hashlib
import hmac
import random
import re
from typing import Optional

KOREAN_SURNAMES = ["김", "이", "박", "최", "정", "강", "조", "윤", "장", "임"]
GIVEN_NAMES = ["도윤", "서준", "하준", "지호", "서연", "하은", "민서", "지유", "수아", "예준"]
PROVIDER_PREFIX = ["가람모의", "한빛합성", "새길테스트", "도담비실", "늘봄샘플", "해온모의", "미래합성", "중앙테스트", "푸른비실", "라온샘플"]
PROVIDER_SUFFIX = ["의원", "병원", "정형외과", "내과", "영상의학과", "재활의학과", "청구검증센터"]


@dataclass(frozen=True)
class PrivacyContext:
    secret_key: bytes
    claim_id: str
    patient_entity_id: str
    provider_family_id: str


def _stable_int(key: bytes, value: str, modulo: int) -> int:
    digest = hmac.new(key, value.encode("utf-8"), hashlib.sha256).digest()
    return int.from_bytes(digest[:8], "big") % modulo


def pseudonym_name(ctx: PrivacyContext) -> str:
    a = _stable_int(ctx.secret_key, ctx.patient_entity_id + ":surname", len(KOREAN_SURNAMES))
    b = _stable_int(ctx.secret_key, ctx.patient_entity_id + ":given", len(GIVEN_NAMES))
    return KOREAN_SURNAMES[a] + GIVEN_NAMES[b]


def pseudonym_provider(ctx: PrivacyContext) -> str:
    a = _stable_int(ctx.secret_key, ctx.provider_family_id + ":prefix", len(PROVIDER_PREFIX))
    b = _stable_int(ctx.secret_key, ctx.provider_family_id + ":suffix", len(PROVIDER_SUFFIX))
    return PROVIDER_PREFIX[a] + PROVIDER_SUFFIX[b]


def synthetic_patient_registration_no(ctx: PrivacyContext) -> str:
    n = _stable_int(ctx.secret_key, ctx.patient_entity_id + ":reg", 999999)
    return f"PX-{n:06d}"  # deliberately non-official format


def synthetic_receipt_no(ctx: PrivacyContext, seq: int = 1) -> str:
    n = _stable_int(ctx.secret_key, ctx.claim_id + ":receipt", 999999)
    return f"SYN-{n:06d}-{seq:02d}"


def invalid_business_registration_no(ctx: PrivacyContext) -> str:
    # Deliberately synthetic namespace prefix; do not generate valid 10-digit real-like identifiers.
    n = _stable_int(ctx.secret_key, ctx.provider_family_id + ":biz", 999999)
    return f"BIZ-SYN-{n:06d}"


def shift_date_yyyy_mm_dd(date_str: str, day_offset: int) -> str:
    from datetime import datetime, timedelta
    dt = datetime.strptime(date_str, "%Y-%m-%d") + timedelta(days=day_offset)
    return dt.strftime("%Y-%m-%d")


def leak_scan(text: str, known_provider_blacklist: Optional[list[str]] = None) -> list[str]:
    """Return leakage findings for manifest/text outputs.

    This is a regex guardrail, not a legal/privacy guarantee. It must be paired
    with manual review and secure-zone controls.
    """
    findings: list[str] = []
    patterns = {
        "rrn_like": r"\b\d{6}[- ]?[1-4]\d{6}\b",
        "phone_like": r"\b0\d{1,2}[- ]?\d{3,4}[- ]?\d{4}\b",
        "biz_no_like": r"\b\d{3}[- ]?\d{2}[- ]?\d{5}\b",
        "card_like": r"\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b",
        "bank_account_like": r"\b\d{2,6}[- ]\d{2,6}[- ]\d{2,8}\b",
    }
    for name, pattern in patterns.items():
        if re.search(pattern, text):
            findings.append(name)
    for provider in known_provider_blacklist or []:
        if provider and provider in text:
            findings.append(f"known_provider:{provider}")
    return findings
