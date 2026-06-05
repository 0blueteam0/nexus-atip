from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageDraw

from claim_fds_synth.stg_local_tamper import (
    build_field_candidate_pool,
    field_name_ko,
    generate_stg_local_tamper_dataset,
)


def _draw_source(path: Path, text_a: str, text_b: str, *, tint: tuple[int, int, int]) -> None:
    img = Image.new("RGB", (520, 280), tint)
    d = ImageDraw.Draw(img)
    d.rectangle((30, 35, 490, 245), outline=(80, 115, 160), width=2)
    d.line((30, 100, 490, 100), fill=(80, 115, 160), width=1)
    d.line((30, 165, 490, 165), fill=(80, 115, 160), width=1)
    d.text((55, 58), text_a, fill=(20, 20, 20))
    d.text((55, 122), text_b, fill=(20, 20, 20))
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, quality=90)


def _make_source_manifest(root: Path) -> Path:
    _draw_source(root / "images" / "NO_SOURCE_진단서_001.jpg", "진단명: 요추부 염좌", "질병분류기호: M54.5", tint=(248, 246, 238))
    _draw_source(root / "images" / "NO_SOURCE_진단서_002.jpg", "진단명: 반월상연골 파열", "질병분류기호: S83.2", tint=(247, 245, 237))
    rows = [
        {
            "dataset_id": "NO_REAL_WEB_DIAG_001",
            "claim_id": "SRC-001",
            "source_url": "https://example.org/public-medical-claim-sample-001.jpg",
            "source_page_url": "https://example.org/public-medical-claim-samples",
            "source_collection_method": "web_public_image_candidate",
            "privacy_review_status": "pseudonymized_after_quarantine_review",
            "document_type": "diagnosis_certificate",
            "label_family": "NO",
            "file_name": "images/NO_SOURCE_진단서_001.jpg",
            "field_bboxes": [
                {"field": "diagnosis_name", "bbox": [50, 52, 260, 88], "critical": True},
                {"field": "disease_code", "bbox": [50, 116, 260, 152], "critical": True},
            ],
        },
        {
            "dataset_id": "NO_REAL_WEB_DIAG_002",
            "claim_id": "SRC-002",
            "source_url": "https://example.org/public-medical-claim-sample-002.jpg",
            "source_page_url": "https://example.org/public-medical-claim-samples",
            "source_collection_method": "web_public_image_candidate",
            "privacy_review_status": "pseudonymized_after_quarantine_review",
            "document_type": "diagnosis_certificate",
            "label_family": "NO",
            "file_name": "images/NO_SOURCE_진단서_002.jpg",
            "field_bboxes": [
                {"field": "diagnosis_name", "bbox": [50, 52, 260, 88], "critical": True},
                {"field": "disease_code", "bbox": [50, 116, 260, 152], "critical": True},
            ],
        },
    ]
    manifest = root / "manifest.v4.jsonl"
    manifest.write_text("\n".join(json.dumps(row, ensure_ascii=False) for row in rows) + "\n", encoding="utf-8")
    return manifest


def test_stg_local_tamper_should_distinguish_source_no_and_tampered_af_names(tmp_path):
    source_root = tmp_path / "source"
    manifest = _make_source_manifest(source_root)
    out = tmp_path / "stg_out"

    result = generate_stg_local_tamper_dataset(
        manifest,
        source_root,
        out,
        max_samples=2,
        attack_families=["semantic_diagnosis_code_mismatch"],
        image_quality=80,
        require_web_source_originals=True,
    )

    assert result["ok"] is True
    rows = [json.loads(line) for line in (out / "manifest.stg.v1.jsonl").read_text(encoding="utf-8").splitlines() if line.strip()]
    assert rows
    row = rows[0]
    assert row["source_original_label_family"] == "NO"
    assert row["tampered_label_family"] == "AF"
    assert "NO원본" in row["source_original_copy_path"]
    assert "AF변조" in row["file_name"]
    assert "원본ID-NO_REAL_WEB_DIAG" in row["file_name"]
    assert "변조대상필드-진단명" in row["file_name"]
    assert row["target_field"] == "diagnosis_name"
    assert row["target_field_ko"] == "진단명"
    assert row["donor_field_ko"] in {"진단명", "질병분류기호"}
    assert row["donor_semantic_compatible"] is True
    assert set(row["compatible_donor_fields"]) == {"diagnosis_name", "disease_code", "surgery_name"}
    assert (out / row["source_original_copy_path"]).exists()
    assert (out / row["file_name"]).exists()
    assert "tamper_mask" not in row
    assert not (out / "stg_local_tamper" / "tamper_masks").exists()
    assert "합성직인무효" not in row["organized_file_path"]
    assert "제출불가" not in row["organized_file_path"]
    assert "국소필드치환_가명처리" in row["organized_file_path"]
    assert row["privacy_state"] == "pseudonymized_rewrite"
    assert row["original_source_basis"] == "real_web_public_image"
    assert row["target_source_url"].startswith("https://example.org/public-medical-claim-sample-")
    assert row["target_region_pixel_count"] > 0
    assert row["outside_bbox_diff_pixels"] == 0


def test_field_name_ko_should_make_english_internal_fields_reviewable():
    assert field_name_ko("diagnosis_name") == "진단명"
    assert field_name_ko("disease_code") == "질병분류기호"
    assert field_name_ko("patient_burden_total") == "본인부담금합계"
    assert field_name_ko("unknown_vendor_field") == "미분류필드"
