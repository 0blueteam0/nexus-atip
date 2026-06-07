from __future__ import annotations

import hashlib
import json
from pathlib import Path

from scripts.insurance_fds_case1_real_document_collector import (
    build_human_review_table,
    collect_real_external_documents,
    load_reviewed_registry,
    select_real_external_document_candidates,
    validate_real_document_manifest,
)


def _write_fake_pdf(path: Path) -> None:
    path.write_bytes(b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 0>>endobj\n%%EOF\n")


def test_should_select_only_accepted_external_non_generated_download_candidates(tmp_path):
    fake_pdf = tmp_path / "official_claim_form.pdf"
    _write_fake_pdf(fake_pdf)
    registry = {
        "reviewed_sources": [
            {
                "source_id": "CASE1-SRC-0001",
                "review_status": "accepted",
                "source_authority_level": "official",
                "source_category": "blank_form_or_pdf",
                "title": "[PDF] 보험금 청구서 - 공식",
                "url": fake_pdf.as_uri(),
                "covered_document_types": ["보험금 청구서"],
                "korean_filename_prefix": "케이스1_정상청구문서_수집_출처_0001",
            },
            {
                "source_id": "CASE1-SRC-0002",
                "review_status": "rejected_or_reference",
                "source_authority_level": "unreviewed",
                "source_category": "blank_form_or_pdf",
                "title": "블로그 첨부",
                "url": "https://example.com/blog.pdf",
                "covered_document_types": ["보험금 청구서"],
                "korean_filename_prefix": "케이스1_정상청구문서_수집_출처_0002",
            },
            {
                "source_id": "CASE1-SRC-0003",
                "review_status": "accepted",
                "source_authority_level": "official",
                "source_category": "claim_document_guidance",
                "title": "HTML 안내 페이지",
                "url": "https://example.com/guide",
                "covered_document_types": ["처방전"],
                "korean_filename_prefix": "케이스1_정상청구문서_수집_출처_0003",
            },
        ]
    }

    candidates = select_real_external_document_candidates(registry)

    assert [candidate["source_id"] for candidate in candidates] == ["CASE1-SRC-0001"]
    assert candidates[0]["actual_document_origin"] == "external_web_or_file"
    assert candidates[0]["generated_or_synthetic"] is False
    assert candidates[0]["case1_promotion_state"] == "raw_public_form_candidate"


def test_should_collect_real_external_documents_with_hash_manifest_and_no_generated_flag(tmp_path):
    fake_pdf = tmp_path / "official_claim_form.pdf"
    _write_fake_pdf(fake_pdf)
    expected_sha256 = hashlib.sha256(fake_pdf.read_bytes()).hexdigest()
    registry = {
        "reviewed_sources": [
            {
                "source_id": "CASE1-SRC-0001",
                "review_status": "accepted",
                "source_authority_level": "official",
                "source_category": "blank_form_or_pdf",
                "title": "[PDF] 보험금 청구서 - 공식",
                "url": fake_pdf.as_uri(),
                "covered_document_types": ["보험금 청구서"],
                "korean_filename_prefix": "케이스1_정상청구문서_수집_출처_0001",
            }
        ]
    }
    output_dir = tmp_path / "실제외부문서_원본보관_v0_1"

    manifest = collect_real_external_documents(registry, output_dir)

    assert manifest["artifact"].endswith("실제외부문서_수집프로파일_v0_1")
    assert manifest["generated_documents_allowed"] is False
    assert manifest["downloaded_count"] == 1
    item = manifest["documents"][0]
    assert item["source_id"] == "CASE1-SRC-0001"
    assert item["generated_or_synthetic"] is False
    assert item["actual_document_origin"] == "external_web_or_file"
    assert item["sha256"] == expected_sha256
    assert item["file_size_bytes"] > 20
    assert Path(item["local_path"]).exists()
    assert "케이스1_정상청구문서_수집_출처_0001" in Path(item["local_path"]).name

    result = validate_real_document_manifest(manifest)
    assert result["ok"] is True
    assert result["generated_document_count"] == 0
    assert result["downloaded_real_document_count"] == 1


def test_should_build_human_review_table_for_real_external_documents(tmp_path):
    manifest = {
        "documents": [
            {
                "source_id": "CASE1-SRC-0001",
                "title": "[PDF] 보험금 청구서 - 공식",
                "source_authority_level": "official",
                "covered_document_types": ["보험금 청구서"],
                "local_path": str(tmp_path / "a.pdf"),
                "sha256": "a" * 64,
                "generated_or_synthetic": False,
                "pii_policy": "public_blank_form_only_no_real_personal_data",
                "human_review_status": "needs_visual_review",
            }
        ]
    }

    table = build_human_review_table(manifest)

    assert "# 케이스1 실제 외부 정상문서 육안검수표" in table
    assert "CASE1-SRC-0001" in table
    assert "생성문서 아님" in table
    assert "needs_visual_review" in table


def test_should_load_registry_from_real_case1_path():
    path = Path(
        "data/insurance-fds-generated/five-case-dataset-ko/"
        "케이스1_정상_실손보험_청구문서_사진_수집/"
        "케이스1_정상청구문서_수집_공식출처_검토등록부_v0_1.ko.json"
    )
    registry = load_reviewed_registry(path)
    candidates = select_real_external_document_candidates(registry)

    assert len(candidates) >= 5
    assert all(candidate["review_status"] == "accepted" for candidate in candidates)
    assert all(candidate["generated_or_synthetic"] is False for candidate in candidates)
