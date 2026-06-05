from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageDraw

from src.claim_fds_synth.reference_profiler import profile_reference_set
from src.claim_fds_synth.template_family import sample_template_family
from src.claim_fds_synth.v4_lab import generate_v4_lab


def _make_reference_fixture(root: Path) -> Path:
    """실제 이미지 대신 안전한 합성 fixture로 참조 프로파일 schema를 검증한다."""

    root.mkdir(parents=True, exist_ok=True)
    img = Image.new("RGB", (600, 900), (232, 231, 226))
    draw = ImageDraw.Draw(img)
    draw.rectangle((48, 70, 552, 820), fill=(250, 250, 247), outline=(80, 80, 80), width=2)
    for y in range(130, 760, 42):
        draw.line((70, y, 530, y), fill=(120, 120, 120), width=1)
    fixture = root / "safe_reference_fixture.png"
    img.save(fixture)
    return root


def test_reference_profiler_should_store_statistics_not_source_pixels_or_ocr(tmp_path):
    reference_root = _make_reference_fixture(tmp_path / "refs")

    profile = profile_reference_set(reference_root, profile_id="unit_profile")

    assert profile["schema_version"] == "reference_profile.v1"
    assert profile["profile_id"] == "unit_profile"
    assert profile["safety"]["stores_source_pixels"] is False
    assert profile["safety"]["ocr_text_extracted"] is False
    assert profile["safety"]["authorized_safe_reference_only"] is True
    assert profile["document_count"] == 1
    assert profile["aggregate"]["page_aspect_ratio"]["median"] > 0
    assert profile["aggregate"]["foreground_coverage_ratio"]["median"] > 0
    assert "safe_reference_fixture.png" in profile["source_fingerprints"]
    assert "extracted_text" not in json.dumps(profile, ensure_ascii=False)
    assert "recognized_text" not in json.dumps(profile, ensure_ascii=False)


def test_template_family_sampler_should_produce_safe_renderer_profile(tmp_path):
    profile = profile_reference_set(_make_reference_fixture(tmp_path / "refs"), profile_id="unit_profile")

    family = sample_template_family(profile, seed=7)

    assert family["schema_version"] == "template_family.v1"
    assert family["synthetic_only"] is True
    assert family["sampled_from_profile_id"] == "unit_profile"
    assert family["rendering"]["page_tone_rgb"]
    assert 70 <= family["rendering"]["margin_px"] <= 170
    assert family["capture_profile"]["benign_condition_default_label"] == "benign_document_condition"


def test_generate_v4_lab_should_emit_qc_jsonl_splits_and_bundle_reason_codes(tmp_path):
    out = tmp_path / "outputs"
    reference_root = _make_reference_fixture(tmp_path / "refs")

    result = generate_v4_lab(output_dir=out, reference_dir=reference_root, seed=20260605)

    assert result["ok"] is True
    assert (out / "reference_profile.v1.json").exists()
    assert (out / "template_family.v1.json").exists()
    assert (out / "manifest.v4.jsonl").exists()
    assert (out / "splits.v4.json").exists()
    assert (out / "qc_report_v4.json").exists()
    assert (out / "v4_montage.png").exists()

    qc = json.loads((out / "qc_report_v4.json").read_text(encoding="utf-8"))
    assert qc["quality_gate"]["all_generated_pages_overflow_free"] is True
    assert qc["quality_gate"]["critical_fields_not_truncated"] is True
    assert qc["quality_gate"]["benign_conditions_not_fraud"] is True
    assert qc["quality_gate"]["tamper_masks_align_changed_field_bboxes"] is True
    assert qc["clean_bundle_graph"]["all_pass"] is True
    assert qc["tampered_bundle_graph"]["all_pass"] is False
    assert qc["tampered_bundle_graph"]["failed_reason_codes"] == ["RECEIPT_DETAIL_TOTAL_MISMATCH"]

    rows = [json.loads(line) for line in (out / "manifest.v4.jsonl").read_text(encoding="utf-8").splitlines() if line.strip()]
    assert rows
    assert {row["label_family"] for row in rows} >= {"NO", "AF"}
    assert all(row["synthetic_only"] is True for row in rows)
    assert all(row["leakage_group"] for row in rows)

    splits = json.loads((out / "splits.v4.json").read_text(encoding="utf-8"))
    split_groups = [set(v["leakage_groups"]) for v in splits.values()]
    for i, left in enumerate(split_groups):
        for right in split_groups[i + 1:]:
            assert left.isdisjoint(right)
