from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageDraw

from claim_fds_synth.v4_high_fidelity_factory import generate_high_fidelity_dataset


CLUSTERS = ["C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8"]
DOC_TYPES = {
    "medical_receipt",
    "medical_detail_statement",
    "pharmacy_receipt",
    "prescription",
    "claim_application",
    "diagnosis_certificate",
    "hospitalization_confirmation",
    "outpatient_confirmation",
    "medical_opinion",
    "surgery_confirmation",
    "claim_review_cover_sheet",
    "inpatient_detail_statement",
    "supporting_evidence_checklist",
}

ATTACK_FAMILIES = {
    "semantic_amount_mismatch",
    "semantic_diagnosis_code_mismatch",
    "semantic_drug_mismatch",
    "semantic_duplicate_claim",
    "semantic_provider_mismatch",
    "semantic_hospitalization_period_mismatch",
    "semantic_inpatient_room_charge_inflation",
    "semantic_line_item_insertion",
    "semantic_surgery_anesthesia_mismatch",
    "semantic_supporting_document_checkbox_mismatch",
}

INPATIENT_REASON_CODES = {
    "R602_ADMISSION_PERIOD_MISMATCH",
    "R302_NONCOVERED_OVERBILLING",
    "R304_QUANTITY_OVERCLAIM",
    "R504_PRESCRIPTION_PERIOD_ANOMALY",
    "R1201_DOCUMENT_INCOMPLETE",
}


def _make_reference_images(root: Path) -> list[Path]:
    root.mkdir(parents=True, exist_ok=True)
    paths: list[Path] = []
    for idx, cluster in enumerate(CLUSTERS, start=1):
        if cluster in {"C2", "C4", "C5", "C8"}:
            size = (900, 430)
        else:
            size = (640, 920)
        bg = (248 - idx * 3, 244 - idx * 2, 232 + idx)
        img = Image.new("RGB", size, bg)
        d = ImageDraw.Draw(img)
        line = (70, 120, 185) if cluster in {"C1", "C2", "C5", "C7"} else (92, 92, 92)
        for y in range(50, size[1] - 40, 28 + idx % 3):
            d.line((35, y, size[0] - 35, y), fill=line, width=1)
        for x in range(35, size[0] - 35, 92):
            d.line((x, 50, x, size[1] - 40), fill=line, width=1)
        if cluster in {"C4", "C6"}:
            d.rectangle((size[0] - 135, 55, size[0] - 70, 120), outline=(30, 30, 30), width=3)
        if cluster in {"C5", "C6", "C7"}:
            d.ellipse((size[0] - 165, size[1] - 130, size[0] - 95, size[1] - 60), outline=(190, 30, 30), width=4)
        if cluster == "C2":
            d.rectangle((size[0] - 240, 70, size[0] - 60, 120), outline=(110, 70, 140), width=3)
        path = root / f"{cluster}_fixture.png"
        img.save(path)
        paths.append(path)
    return paths


def test_high_fidelity_factory_should_emit_8_clusters_4_docs_privacy_safe_splits(tmp_path):
    reference_paths = _make_reference_images(tmp_path / "refs")
    out = tmp_path / "out"

    result = generate_high_fidelity_dataset(
        reference_image_paths=reference_paths,
        output_dir=out,
        seed=20260605,
        bundles_per_cluster=1,
    )

    assert result["ok"] is True
    qc = json.loads((out / "qc_report.v4.json").read_text(encoding="utf-8"))
    assert qc["quality_gate"]["pass"] is True
    assert qc["quality_gate"]["layout_overflow_count"] == 0
    assert qc["quality_gate"]["critical_truncated_fields"] == []
    assert qc["quality_gate"]["privacy_leakage_findings"] == []
    assert qc["clean_bundle_semantics"]["all_pass"] is True
    assert qc["tampered_bundle_semantics"]["failed_reason_codes"] == ["RECEIPT_DETAIL_TOTAL_MISMATCH"]

    rows = [json.loads(line) for line in (out / "manifest.v4.jsonl").read_text(encoding="utf-8").splitlines() if line.strip()]
    assert {row["visual_cluster_id"] for row in rows} >= set(CLUSTERS)
    assert {row["document_type"] for row in rows} >= DOC_TYPES
    assert {row.get("attack_family") for row in rows if row["label_family"] == "AF"} >= ATTACK_FAMILIES
    observed_reason_codes = {code for row in rows for code in row.get("reason_codes", [])}
    assert observed_reason_codes >= INPATIENT_REASON_CODES
    assert all(row["synthetic_only"] is True for row in rows)
    assert all(row["privacy_state"] == "synthetic_rewrite" for row in rows)
    assert all(row["raw_value_retention"] is False for row in rows)
    assert all(row.get("fraud_label") in {"none", "synthetic_cross_document_mismatch"} for row in rows)
    assert all(row.get("document_condition") != "fraud" for row in rows)
    assert all("tamper_mask" not in row for row in rows)
    assert all("changed_fields" not in row for row in rows)

    split = json.loads((out / "splits.v4.json").read_text(encoding="utf-8"))
    all_groups = []
    for part in ["train", "validation", "test"]:
        assert split[part]["leakage_groups"]
        all_groups.extend(split[part]["leakage_groups"])
    assert len(all_groups) == len(set(all_groups))


def test_high_fidelity_factory_should_generate_many_claim_bundles_without_tamper_masks(tmp_path):
    reference_paths = _make_reference_images(tmp_path / "refs")
    out = tmp_path / "out_many"

    result = generate_high_fidelity_dataset(
        reference_image_paths=reference_paths,
        output_dir=out,
        seed=20260605,
        bundles_per_cluster=3,
    )

    assert result["ok"] is True
    rows = [json.loads(line) for line in (out / "manifest.v4.jsonl").read_text(encoding="utf-8").splitlines() if line.strip()]
    claim_ids = {row["claim_id"] for row in rows}
    assert len(claim_ids) == 24
    assert len(rows) >= 24 * 5
    assert {row["document_type"] for row in rows} >= DOC_TYPES
    assert {row.get("attack_family") for row in rows if row["label_family"] == "AF"} >= ATTACK_FAMILIES
    observed_reason_codes = {code for row in rows for code in row.get("reason_codes", [])}
    assert observed_reason_codes >= INPATIENT_REASON_CODES
    assert (out / "summary_ko.v4.xlsx").exists()
    assert (out / "fds_scenario_taxonomy_ko.v4.csv").exists()
    assert (out / "reference_form_source_catalog_ko.v4.json").exists()
    assert all("tamper_mask" not in row for row in rows)
    assert not (out / "masks").exists()
