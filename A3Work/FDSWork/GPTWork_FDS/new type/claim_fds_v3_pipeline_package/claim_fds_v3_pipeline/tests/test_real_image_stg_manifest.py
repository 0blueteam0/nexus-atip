from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageDraw

from scripts.build_real_image_stg_manifest import build_real_image_stg_manifest, classify_ocr_token_for_stg


def test_classify_ocr_token_should_prioritize_document_fields_and_reject_noise():
    assert classify_ocr_token_for_stg("14,000") == "patient_burden_total"
    assert classify_ocr_token_for_stg("2024-04-16") == "treatment_date"
    assert classify_ocr_token_for_stg("M54.5") == "disease_code"
    assert classify_ocr_token_for_stg("MRI") == "line_item_name"
    assert classify_ocr_token_for_stg("panda profile banner") is None
    assert classify_ocr_token_for_stg("푸바오 배너") is None


def test_build_real_image_stg_manifest_should_emit_no_source_candidates_without_mask_or_block(tmp_path):
    image_dir = tmp_path / "Real Image"
    image_dir.mkdir()
    img = Image.new("RGB", (720, 960), "white")
    draw = ImageDraw.Draw(img)
    draw.rectangle((40, 40, 680, 900), outline=(40, 40, 40), width=2)
    draw.text((80, 120), "2024-04-16", fill=(0, 0, 0))
    draw.text((80, 180), "14,000", fill=(0, 0, 0))
    src = image_dir / "receipt.jpg"
    img.save(src, quality=90)

    fake_ocr = [
        {"text": "2024-04-16", "bbox_xyxy": [80, 120, 190, 145], "confidence": 0.95},
        {"text": "14,000", "bbox_xyxy": [80, 180, 150, 205], "confidence": 0.96},
        {"text": "panda profile banner", "bbox_xyxy": [20, 20, 60, 40], "confidence": 0.99},
    ]

    result = build_real_image_stg_manifest(
        image_dir=image_dir,
        output_dir=tmp_path / "manifest_out",
        ocr_runner=lambda _path: fake_ocr,
        min_fields_per_image=2,
    )

    assert result["ok"] is True
    assert result["source_image_count"] == 1
    assert result["manifest_row_count"] == 1
    assert result["field_candidate_count"] == 2
    assert result["noise_rejected_token_count"] == 1

    manifest = Path(result["manifest_path"])
    row = json.loads(manifest.read_text(encoding="utf-8").splitlines()[0])
    assert row["label_family"] == "NO"
    assert row["source_collection_method"] == "user_supplied_real_image_folder_ocr_profiled"
    assert row["privacy_review_status"] == "pseudonymized_or_public_sample_requires_manual_review"
    assert row["raw_value_retention"] is False
    assert set(item["field"] for item in row["field_bboxes"]) == {"treatment_date", "patient_burden_total"}
    payload = json.dumps(row, ensure_ascii=False)
    assert "mask" not in payload.lower()
    assert "block" not in payload.lower()
    assert "블럭" not in payload
    assert "마스크" not in payload
    assert Path(result["copied_image_dir"]).exists()
