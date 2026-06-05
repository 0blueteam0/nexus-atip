from __future__ import annotations

import importlib.util
import sys
from pathlib import Path


SCRIPT_PATH = Path(__file__).resolve().parents[1] / "scripts" / "collect_real_insurance_claim_sources.py"
spec = importlib.util.spec_from_file_location("collect_real_insurance_claim_sources", SCRIPT_PATH)
collector = importlib.util.module_from_spec(spec)
assert spec and spec.loader
sys.modules[spec.name] = collector
spec.loader.exec_module(collector)


def test_relevance_score_should_reject_placeholder_and_stock_assets():
    noisy_assets = [
        "https://t1.daumcdn.net/tistory_admin/static/manage/images/r3/default_L.png",
        "https://t1.daumcdn.net/tistory_admin/static/images/no-image-v1.png",
        "https://www.mohw.go.kr/kor/img/homeimg.png",
        "https://example.org/dropdown-profile_bg.jpg",
        "https://cdn.example.org/AdobeStock_634190634.jpeg",
        "https://www.hira.or.kr/images/contents/call_code.png",
        "https://www.nhis.or.kr/_res/nhis/nhis/img/newimg/2026_Go2.png",
        "https://www.nhis.or.kr/_res/nhis/htmc/img/main/nav/ic_search.png",
        "https://www.hira.or.kr/images/contents/img_D1_COMP_01_01_01.png",
        "https://cdn.kbthink.com/content/dam/tam-dcp-cms/kbcontent/insurance/actual-cost-insurance/img-01-mo.jpg",
    ]

    for image_url in noisy_assets:
        score, reject = collector.relevance_score(
            '"실손보험" "보험금 청구서" "양식"',
            "https://example.org/insurance-guide/actual-loss.html",
            image_url,
        )
        assert score <= 0
        assert "non_document_or_placeholder_asset" in reject


def test_relevance_score_should_keep_actual_document_like_assets():
    score, reject = collector.relevance_score(
        "진료비 계산서 영수증 실손 보험금 청구 사진",
        "https://example.org/claim-review/sample",
        "https://example.org/uploads/진료비_계산서_영수증_스캔.png",
    )

    assert score >= 4
    assert reject == ""


def test_document_type_label_should_hide_internal_english_tokens():
    assert collector.document_type_label("medical_receipt") == "진료비계산서영수증"
    assert collector.document_type_label("unknown_doc_type") == "문서유형미분류"
