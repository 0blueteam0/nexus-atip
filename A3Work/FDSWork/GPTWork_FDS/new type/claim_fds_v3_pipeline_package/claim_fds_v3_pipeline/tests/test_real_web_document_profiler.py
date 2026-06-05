from __future__ import annotations

import importlib.util
import sys
from pathlib import Path


SCRIPT_PATH = Path(__file__).resolve().parents[1] / "scripts" / "profile_real_web_document_candidates.py"
spec = importlib.util.spec_from_file_location("profile_real_web_document_candidates", SCRIPT_PATH)
profiler = importlib.util.module_from_spec(spec)
assert spec and spec.loader
sys.modules[spec.name] = profiler
spec.loader.exec_module(profiler)


def test_context_gate_should_reject_legacy_broad_downloads_by_default():
    row = {
        "collection_status": "downloaded_quarantine",
        "query": '"진료비 세부산정내역서" "스캔"',
        "title": "The Office Hotel - What's On in Sydney CBD Sydney",
        "page_url": "https://eatdrinkcheap.com.au/sydney/the-office-hotel-sydney-cbd",
        "image_url": "https://eatdrinkcheap.com.au/images/venue/hotel-cbd-sydney-cbd.jpg",
    }

    reason = profiler.row_context_reject_reason(row)

    assert reason == "legacy_or_unverified_download_not_ocr_vision_passed"


def test_context_gate_should_reject_negative_non_document_web_context_even_when_legacy_allowed():
    row = {
        "collection_status": profiler.OCR_VISION_PASS_STATUS,
        "query": '"진료비 세부산정내역서" "스캔"',
        "title": "Beautiful beach travel wallpaper",
        "page_url": "https://example.org/travel/beach",
        "image_url": "https://cdn.example.org/shutterstock_beach.jpg",
    }

    reason = profiler.row_context_reject_reason(row, allow_legacy_downloads=True)

    assert reason == "negative_non_document_web_context"


def test_context_gate_should_keep_ocr_vision_passed_claim_document_context():
    row = {
        "collection_status": profiler.OCR_VISION_PASS_STATUS,
        "query": '"진료비 계산서 영수증" "실손"',
        "title": "진료비 계산서 영수증 실손보험 청구 후기",
        "page_url": "https://example.org/claim-review",
        "image_url": "https://example.org/uploads/medical_receipt_scan.jpg",
    }

    reason = profiler.row_context_reject_reason(row)

    assert reason == ""
