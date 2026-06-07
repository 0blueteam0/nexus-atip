from __future__ import annotations

import json
from pathlib import Path

import pytest
import scripts.insurance_fds_real_submission_cycle as cycle

from scripts.insurance_fds_real_submission_cycle import (
    SourceSeed,
    collect_and_generate,
    detect_text_band_boxes_from_image,
    filtered_source_seeds,
    is_submission_evidence_seed,
    validate_manifest,
)


def test_should_reject_insurer_claim_form_when_collecting_submission_evidence() -> None:
    seed = SourceSeed(
        source_id="BAD-INSURER-CLAIM",
        title="보험금 청구서 - 보험회사 PDF",
        url="https://example.invalid/claim.pdf",
        document_type="medical_receipt",
        authority="official",
        source_note="보험금 청구서 양식",
    )

    assert is_submission_evidence_seed(seed) is False
    assert filtered_source_seeds([seed]) == []


def test_should_accept_hospital_or_pharmacy_submission_evidence_seed() -> None:
    seed = SourceSeed(
        source_id="GOOD-PHARMACY",
        title="약제비 계산서ㆍ영수증",
        url="https://example.invalid/pharmacy.pdf",
        document_type="pharmacy_receipt",
        authority="official_statutory_form",
        source_note="실손보험 청구 시 제출하는 약국 영수증 공식 서식",
    )

    assert is_submission_evidence_seed(seed) is True
    assert filtered_source_seeds([seed]) == [seed]


def test_should_validate_same_bbox_pairs_and_real_sources(tmp_path: Path) -> None:
    raw = tmp_path / "raw.pdf"
    preview = tmp_path / "preview.png"
    no_img = tmp_path / "no.png"
    af_img = tmp_path / "af.png"
    for path in [raw, preview, no_img, af_img]:
        path.write_bytes(b"x")

    manifest = {
        "source_records": [
            {
                "source_id": "REAL-SUB-TEST",
                "document_type": "pharmacy_receipt",
                "local_path": str(raw),
                "preview_image_path": str(preview),
            }
        ],
        "pair_records": [
            {
                "pair_id": "P1",
                "no_image_path": str(no_img),
                "af_image_path": str(af_img),
                "outside_target_changed_pixels": 0,
                "bbox_ok": True,
            },
            {
                "pair_id": "P2",
                "no_image_path": str(no_img),
                "af_image_path": str(af_img),
                "outside_target_changed_pixels": 0,
                "bbox_ok": True,
            },
        ],
        "failures": [],
        "contact_sheet_path": str(preview),
    }

    validation = validate_manifest(manifest)

    assert validation["ok"] is False  # only one source: final gate requires at least two real sources
    assert validation["bad_same_bbox_pair_ids"] == []
    assert validation["insurer_or_non_submission_source_ids"] == []


def test_should_detect_text_band_boxes_when_pdf_has_no_text_layer(tmp_path: Path) -> None:
    from PIL import Image, ImageDraw

    image_path = tmp_path / "scan_like.png"
    img = Image.new("L", (500, 700), 255)
    draw = ImageDraw.Draw(img)
    draw.rectangle((80, 80, 430, 620), outline=0, width=2)
    draw.text((120, 140), "patient 2026-05-13", fill=0)
    draw.text((120, 220), "total 187,500", fill=0)
    draw.text((120, 300), "noncovered 129,000", fill=0)
    img.save(image_path)

    boxes = detect_text_band_boxes_from_image(image_path)

    assert len(boxes) >= 3
    assert all(box[2] > box[0] and box[3] > box[1] for box in boxes[:3])


def test_should_collect_generate_and_preserve_same_bbox_on_limited_real_cycle(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    import fitz

    pdf_path = tmp_path / "local_form.pdf"
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)
    # 텍스트 레이어가 없어도 fallback이 실제 렌더링된 표선 좌표를 잡을 수 있게 간단한 blank form을 만든다.
    for y in [120, 160, 200, 240, 280, 320]:
        page.draw_line((90, y), (505, y), color=(0, 0, 0), width=1)
    for x in [90, 220, 360, 505]:
        page.draw_line((x, 120), (x, 320), color=(0, 0, 0), width=1)
    doc.save(pdf_path)
    doc.close()
    pdf_bytes = pdf_path.read_bytes()

    monkeypatch.setattr(
        cycle,
        "default_source_seeds",
        lambda: [
            SourceSeed(
                source_id="LOCAL-REAL-SUB-0001",
                title="약제비 계산서ㆍ영수증 테스트 PDF",
                url="https://example.invalid/local.pdf",
                document_type="pharmacy_receipt",
                authority="local_test_public_form",
                source_note="실손보험 청구 시 제출하는 약제비 계산서 영수증 테스트 서식",
            )
        ],
    )
    monkeypatch.setattr(cycle, "download_url", lambda url: (pdf_bytes, "application/pdf", url))

    manifest = collect_and_generate(tmp_path / "cycle", limit=1)

    assert manifest["validation"]["source_count"] >= 1
    assert manifest["field_target_count"] >= 1
    assert manifest["pair_count"] >= 1
    assert manifest["validation"]["bad_same_bbox_pair_ids"] == []
    assert all(pair["outside_target_changed_pixels"] == 0 for pair in manifest["pair_records"])
    assert all(pair["bbox_ok"] is True for pair in manifest["pair_records"])
    assert all(record["generated_or_synthetic"] is False for record in manifest["source_records"])
    assert not manifest["validation"]["insurer_or_non_submission_source_ids"]

    manifest_path = tmp_path / "cycle" / "manifests" / "real_submission_bbox_local_substitution_manifest.json"
    assert manifest_path.exists()
    saved = json.loads(manifest_path.read_text(encoding="utf-8"))
    assert saved["source_records"][0]["document_type"] in {"medical_receipt", "pharmacy_receipt", "medical_detail_statement", "prescription"}
