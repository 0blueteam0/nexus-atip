import importlib.util
import json
import sys
from pathlib import Path


MODULE_PATH = Path("scripts/insurance_fds_public_image_collector.py")
SPEC = importlib.util.spec_from_file_location("insurance_fds_public_image_collector", MODULE_PATH)
collector = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
sys.modules["insurance_fds_public_image_collector"] = collector
SPEC.loader.exec_module(collector)

build_korean_search_queries = collector.build_korean_search_queries
extract_bing_image_candidates = collector.extract_bing_image_candidates
normalize_candidate_record = collector.normalize_candidate_record
write_excel_index = collector.write_excel_index


def test_should_include_real_korean_claim_document_keywords():
    queries = build_korean_search_queries()

    joined = "\n".join(queries)
    assert "실손보험 영수증" in joined
    assert "진료비 계산서" in joined
    assert "병원 영수증" in joined
    assert "약제비 영수증" in joined
    assert "진료비 세부산정내역서" in joined
    assert "보험금 청구서" in joined


def test_should_extract_bing_murl_candidates_from_html():
    html = '''
    <html><body>
      <a class="iusc" m='{"murl":"https://example.com/receipt.jpg","turl":"https://example.com/thumb.jpg"}'></a>
      <a class="iusc" m='{"murl":"https://example.com/pharmacy.png","turl":"https://example.com/thumb2.jpg"}'></a>
    </body></html>
    '''

    candidates = extract_bing_image_candidates(html, query="실손보험 영수증")

    assert [row["image_url"] for row in candidates] == [
        "https://example.com/receipt.jpg",
        "https://example.com/pharmacy.png",
    ]
    assert candidates[0]["query"] == "실손보험 영수증"


def test_should_normalize_candidate_with_no_prefix_and_review_flags(tmp_path):
    source = {
        "query": "병원 영수증 실손보험",
        "image_url": "https://example.com/receipt.jpg",
        "thumbnail_url": "https://example.com/thumb.jpg",
        "page_url": "https://example.com/page",
    }

    record = normalize_candidate_record(source, index=7, relative_image_path="images/NO/NO_REAL_PUBLIC_IMAGE_0007.jpg")

    assert record["file_name"].startswith("NO_REAL_PUBLIC_IMAGE_0007")
    assert record["prefix"] == "NO"
    assert record["source_family"] == "public_web_image_candidate"
    assert record["privacy_review_status"] == "quarantine_requires_manual_pii_review"
    assert record["redistribution_status"] == "unknown_requires_source_review"
    assert record["local_image_path"] == "images/NO/NO_REAL_PUBLIC_IMAGE_0007.jpg"


def test_should_write_excel_index(tmp_path):
    output = tmp_path / "index.xlsx"
    records = [
        {
            "dataset_id": "NO_REAL_PUBLIC_IMAGE_0001",
            "file_name": "NO_REAL_PUBLIC_IMAGE_0001.jpg",
            "prefix": "NO",
            "document_type_guess": "진료비영수증",
            "query": "진료비 영수증 실손보험",
            "source_url": "https://example.com/receipt.jpg",
            "source_page_url": "https://example.com/page",
            "local_image_path": "images/NO/NO_REAL_PUBLIC_IMAGE_0001.jpg",
            "privacy_review_status": "quarantine_requires_manual_pii_review",
            "redistribution_status": "unknown_requires_source_review",
            "fds_value": "정상 제출서류 이미지 도메인 적응 후보",
            "capture_metadata_json": json.dumps({"capture_type": "unknown_public_web_image"}, ensure_ascii=False),
        }
    ]

    write_excel_index(output, records)

    assert output.exists()
    assert output.stat().st_size > 1000
