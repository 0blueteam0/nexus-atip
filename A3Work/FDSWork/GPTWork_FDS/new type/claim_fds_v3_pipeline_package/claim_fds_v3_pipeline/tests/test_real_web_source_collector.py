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


def test_pre_download_gate_should_reject_panda_people_and_profile_noise():
    noisy_rows = [
        ("판다 푸바오 귀여운 사진", "https://example.org/panda.html", "https://cdn.example.org/fubao_panda.jpg"),
        ("보험상담 담당자 프로필", "https://example.org/insurance-agent", "https://cdn.example.org/person_profile_photo.png"),
        ("병원 진료 안내", "https://example.org/hospital", "https://cdn.example.org/doctor_people_banner.jpg"),
    ]

    for title, page_url, image_url in noisy_rows:
        ok, reason = collector.pre_download_candidate_gate(title, page_url, image_url)
        assert ok is False
        assert reason == "non_document_visual_noise"


def test_ocr_signal_should_accept_korean_claim_document_fields():
    tokens = ["진료비 계산서 영수증", "본인부담금", "비급여", "진료일자", "금액 12,300원"]

    signal = collector.score_ocr_document_signal(tokens)

    assert signal["is_korean_claim_document"] is True
    assert signal["field_hint_count"] >= 3


def test_ocr_signal_should_reject_generic_korean_blog_image_text():
    tokens = ["오늘의 판다", "귀여운 동물", "댓글", "공감"]

    signal = collector.score_ocr_document_signal(tokens)

    assert signal["is_korean_claim_document"] is False
    assert signal["field_hint_count"] == 0
