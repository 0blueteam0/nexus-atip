from __future__ import annotations

from PIL import Image


def _mask_has_positive_pixels_in_box(mask: Image.Image, bbox: list[int]) -> bool:
    x1, y1, x2, y2 = bbox
    crop = mask.convert("L").crop((x1, y1, x2, y2))
    return crop.getbbox() is not None


def evaluate_quality_gate(qc: dict, tamper_mask: Image.Image, changed_fields: list[dict], manifest_rows: list[dict]) -> dict:
    """v4 acceptance criteria를 기계적으로 검사한다.

    이 gate는 모델 학습 전 차단막이다. 특히 benign 훼손을 fraud로 라벨링하지 않는지,
    overflow/truncation/mask 정렬 조건을 분리해서 보고한다.
    """

    layout_sections = [qc.get("layout_receipt", {}), qc.get("layout_detail_statement", {})]
    all_overflow_free = all(section.get("overflow_count", 1) == 0 for section in layout_sections)
    critical_not_truncated = all(section.get("truncated_count", 999) <= section.get("max_truncated_allowed", 0) for section in layout_sections)
    benign_rows = [row for row in manifest_rows if str(row.get("document_condition", "")).startswith("benign")]
    benign_not_fraud = all(row.get("fraud_label") in {"none", None, ""} and row.get("label_family") == "NO" for row in benign_rows)
    masks_align = bool(changed_fields) and all(_mask_has_positive_pixels_in_box(tamper_mask, field["bbox"]) for field in changed_fields)
    return {
        "schema_version": "quality_gate.v1",
        "all_generated_pages_overflow_free": all_overflow_free,
        "critical_fields_not_truncated": critical_not_truncated,
        "benign_conditions_not_fraud": benign_not_fraud,
        "tamper_masks_align_changed_field_bboxes": masks_align,
        "manifest_rows_have_leakage_groups": all(bool(row.get("leakage_group")) for row in manifest_rows),
        "pass": all_overflow_free and critical_not_truncated and benign_not_fraud and masks_align,
    }


def make_leakage_safe_splits(rows: list[dict]) -> dict:
    """claim_pair/provider/template/device/attack leakage group이 split 간 섞이지 않도록 배정한다."""

    groups = sorted({row["leakage_group"] for row in rows})
    split_names = ["train", "validation", "test"]
    out = {name: {"leakage_groups": [], "dataset_ids": []} for name in split_names}
    group_to_rows = {group: [row for row in rows if row["leakage_group"] == group] for group in groups}
    for idx, group in enumerate(groups):
        split = split_names[idx % len(split_names)]
        out[split]["leakage_groups"].append(group)
        out[split]["dataset_ids"].extend(row["dataset_id"] for row in group_to_rows[group])
    return out
