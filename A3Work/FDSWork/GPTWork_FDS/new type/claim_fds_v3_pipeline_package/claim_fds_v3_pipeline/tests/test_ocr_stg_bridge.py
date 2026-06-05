from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageDraw

from claim_fds_synth.ocr_stg_bridge import (
    build_stg_manifest_from_ocr_profiles,
    map_ocr_hint_to_internal_field,
    pair_label_value_tokens,
)
from claim_fds_synth.stg_local_tamper import build_field_candidate_pool


def _make_real_web_collection(tmp_path: Path) -> tuple[Path, Path]:
    run = tmp_path / "collection"
    raw = run / "raw_images"
    raw.mkdir(parents=True)
    img_path = raw / "receipt.jpg"
    img = Image.new("RGB", (640, 420), (250, 249, 244))
    d = ImageDraw.Draw(img)
    d.rectangle((35, 35, 605, 385), outline=(80, 110, 150), width=2)
    d.text((70, 80), "진료비 계산서 영수증", fill=(20, 20, 20))
    d.text((70, 145), "총진료비", fill=(20, 20, 20))
    d.text((270, 145), "128,000", fill=(20, 20, 20))
    d.text((70, 205), "진료일자", fill=(20, 20, 20))
    d.text((270, 205), "2026.06.05", fill=(20, 20, 20))
    img.save(img_path)

    manifest = run / "real_web_source_candidates.manifest.jsonl"
    manifest.write_text(
        json.dumps(
            {
                "candidate_id": "NO_REAL_WEB_CANDIDATE_90001",
                "document_type_label_ko": "진료비계산서영수증",
                "document_type_guess": "medical_receipt",
                "page_url": "https://example.org/public/receipt",
                "image_url": "https://example.org/public/receipt.jpg",
                "local_path": str(img_path),
                "privacy_review_status": "pseudonymized_after_quarantine_review",
                "collection_status": "downloaded_quarantine",
            },
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )

    ocr_dir = run / "ocr_profiles" / "ocr_json"
    ocr_dir.mkdir(parents=True)
    (ocr_dir / "NO_REAL_WEB_CANDIDATE_90001.ocr.json").write_text(
        json.dumps(
            {
                "candidate_id": "NO_REAL_WEB_CANDIDATE_90001",
                "store_raw_ocr": False,
                "tokens": [
                    {"token_id": "T0001", "text_redacted": "총진료비", "bbox_xyxy": [70, 140, 155, 170], "confidence": 0.98, "field_hint_ko": "총진료비"},
                    {"token_id": "T0002", "text_redacted": "128,000", "bbox_xyxy": [270, 140, 370, 170], "confidence": 0.99, "field_hint_ko": "금액후보"},
                    {"token_id": "T0003", "text_redacted": "진료일자", "bbox_xyxy": [70, 200, 155, 230], "confidence": 0.98, "field_hint_ko": "진료일자"},
                    {"token_id": "T0004", "text_redacted": "[날짜]", "bbox_xyxy": [270, 200, 390, 230], "confidence": 0.99, "field_hint_ko": "날짜후보"},
                ],
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    return run, manifest


def test_map_ocr_hint_to_internal_field_should_align_fds_attack_fields():
    assert map_ocr_hint_to_internal_field("총진료비", "총진료비") == "total_medical_fee"
    assert map_ocr_hint_to_internal_field("금액후보", "128,000") == "claimed_amount"
    assert map_ocr_hint_to_internal_field("진료일자", "진료일자") == "treatment_date"
    assert map_ocr_hint_to_internal_field("날짜후보", "[날짜]") == "treatment_date"
    assert map_ocr_hint_to_internal_field("미분류필드", "광고") is None


def test_pair_label_value_tokens_should_promote_right_side_value_bbox_to_labeled_field():
    tokens = [
        {"token_id": "T0001", "text_redacted": "총진료비", "bbox_xyxy": [70, 140, 155, 170], "confidence": 0.98, "field_hint_ko": "총진료비"},
        {"token_id": "T0002", "text_redacted": "128,000", "bbox_xyxy": [270, 140, 370, 170], "confidence": 0.99, "field_hint_ko": "금액후보"},
        {"token_id": "T0003", "text_redacted": "진료일자", "bbox_xyxy": [70, 200, 155, 230], "confidence": 0.98, "field_hint_ko": "진료일자"},
        {"token_id": "T0004", "text_redacted": "[날짜]", "bbox_xyxy": [270, 200, 390, 230], "confidence": 0.99, "field_hint_ko": "날짜후보"},
    ]

    pairs = pair_label_value_tokens(tokens)

    assert [p["field"] for p in pairs] == ["total_medical_fee", "treatment_date"]
    assert pairs[0]["bbox"] == [270, 140, 370, 170]
    assert pairs[0]["label_token_id"] == "T0001"
    assert pairs[0]["value_token_id"] == "T0002"
    assert pairs[0]["pairing_method"] == "same_row_right_value"
    assert pairs[1]["bbox"] == [270, 200, 390, 230]
    assert all(p["raw_value_retention"] is False for p in pairs)


def test_build_stg_manifest_from_ocr_profiles_should_create_web_source_field_bboxes(tmp_path):
    run, manifest = _make_real_web_collection(tmp_path)
    out_manifest = tmp_path / "ocr_stg_manifest.v1.jsonl"

    summary = build_stg_manifest_from_ocr_profiles(run, out_manifest)

    assert summary["ok"] is True
    assert summary["row_count"] == 1
    rows = [json.loads(line) for line in out_manifest.read_text(encoding="utf-8").splitlines() if line.strip()]
    row = rows[0]
    assert row["dataset_id"] == "NO_REAL_WEB_CANDIDATE_90001"
    assert row["label_family"] == "NO"
    assert row["source_url"] == "https://example.org/public/receipt.jpg"
    assert row["source_page_url"] == "https://example.org/public/receipt"
    assert row["privacy_review_status"] == "pseudonymized_after_quarantine_review"
    assert row["raw_value_retention"] is False
    assert row["pseudonymization_policy"] == "ocr_redacted_value_rewrite_only"
    assert {item["field"] for item in row["field_bboxes"]} >= {"total_medical_fee", "claimed_amount", "treatment_date"}
    assert all("mask" not in json.dumps(item, ensure_ascii=False).lower() for item in row["field_bboxes"])

    pool = build_field_candidate_pool(out_manifest, tmp_path, require_web_source_originals=True)
    assert {candidate.field_name for candidate in pool} >= {"total_medical_fee", "claimed_amount", "treatment_date"}
