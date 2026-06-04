#!/usr/bin/env python
"""한국 실손보험 FDS v3.2 동일좌표 AF 생성 파이프라인.

이 파일은 이전 v3.1의 약점을 보완한다. v3.1은 AF 이미지를 별도로 다시 렌더링했기 때문에
JSON bbox가 같아도 실제 픽셀 이미지에서는 화질 변환/회전/재렌더링 차이가 생길 수 있었다.

v3.2의 핵심 원칙은 다음과 같다.

1. 먼저 NO 정본 이미지를 만든다.
2. AF 이미지는 NO 정본 이미지를 그대로 복사한다.
3. 변조 대상 필드의 bbox 영역만 같은 좌표에서 배경색으로 되돌리고 mutated value를 재기입한다.
4. AF JSON은 paired_no_dataset_id, paired_no_field_json_path, original bbox를 반드시 기록한다.
5. 검증기는 모든 AF pair에서 NO/AF/tamper_evidence bbox가 같은지와 이미지 diff가 bbox 밖으로 새지 않았는지 확인한다.

주의: 이 파이프라인은 방어적 FDS 탐지 학습용 synthetic/gold-label 데이터 생성기이다.
실제 개인정보, 실제 기관 식별자, 실제 계좌번호를 보존하지 않는다.
"""

from __future__ import annotations

import argparse
import importlib.util
import json
import sys
from pathlib import Path
from typing import Any

from PIL import Image, ImageChops, ImageDraw

BASE_MODULE_PATH = Path(__file__).with_name("insurance_fds_field_pseudonymized_pipeline.py")
BASE_SPEC = importlib.util.spec_from_file_location("insurance_fds_field_pseudonymized_pipeline", BASE_MODULE_PATH)
base = importlib.util.module_from_spec(BASE_SPEC)
assert BASE_SPEC and BASE_SPEC.loader
sys.modules.setdefault("insurance_fds_field_pseudonymized_pipeline", base)
BASE_SPEC.loader.exec_module(base)

DATASET_VERSION = "insurance-fds-field-pseudonymized-v3.2-exact-coordinate-overwrite"
CELL_FILL = (255, 255, 252)
CELL_OUTLINE = (80, 80, 80)


def _rel(path: Path) -> str:
    """manifest에 넣기 쉬운 POSIX 상대 경로 문자열로 변환한다."""

    return str(path).replace("\\", "/")


def choose_tamper_target(document_type: str, values: dict[str, Any]) -> tuple[str, str, Any, Any, list[str]]:
    """문서 유형별로 실제 존재하는 필드 하나를 선택해 탐지용 fake 변조값을 만든다.

    모든 변조값은 가명/synthetic 값이다. 목표는 FDS rule/model이 동일 좌표의 값 변화,
    수식 불일치, 날짜 충돌, issuer mismatch를 학습하도록 하는 것이다.
    """

    if document_type == "medical_receipt":
        return "total_medical_amount", "AF_AMOUNT_INFLATION", values["total_medical_amount"], "287,500", [
            "amount_formula_violation",
            "receipt_claim_amount_mismatch",
            "same_bbox_value_rewrite",
        ]
    if document_type == "medical_detail_statement":
        return "kcd_code", "AF_KCD_DIAGNOSIS_SWAP", values["kcd_code"], "M51.2", [
            "kcd_diagnosis_pair_check",
            "treatment_diagnosis_mismatch",
            "same_bbox_value_rewrite",
        ]
    if document_type == "pharmacy_receipt":
        return "pharmacy_total_amount", "AF_PHARMACY_AMOUNT_INFLATION", values["pharmacy_total_amount"], "198,400", [
            "drug_line_total_check",
            "prescription_pharmacy_total_check",
            "same_bbox_value_rewrite",
        ]
    return "claim_amount", "AF_CLAIM_AMOUNT_MISMATCH", values["claim_amount"], "287,500", [
        "receipt_claim_amount_match",
        "policy_limit_check",
        "same_bbox_value_rewrite",
    ]


def overwrite_value_in_same_bbox(image: Image.Image, bbox: list[int], value: Any, value_type: str) -> Image.Image:
    """NO 이미지의 동일 bbox 영역만 지우고 같은 좌표에 새 값을 쓴 AF 이미지를 반환한다."""

    out = image.copy().convert("RGB")
    draw = ImageDraw.Draw(out)
    box = tuple(int(v) for v in bbox)
    draw.rectangle(box, fill=CELL_FILL, outline=CELL_OUTLINE, width=1)
    align = "right" if value_type == "amount" else "left"
    base.draw_text_in_cell(draw, box, str(value), size=27, align=align)
    return out


def _field_json_path(output_root: Path, prefix: str, dataset_id: str) -> Path:
    """field JSON 저장 위치를 반환한다."""

    return output_root / "fields" / prefix / f"{dataset_id}.json"


def generate_exact_coordinate_dataset(output_root: Path, template_cases: int = 6) -> dict[str, Any]:
    """NO 정본과 동일좌표 AF pair를 생성한다."""

    schemas = base.build_standard_document_schemas()
    output_root.mkdir(parents=True, exist_ok=True)
    (output_root / "images" / "NO").mkdir(parents=True, exist_ok=True)
    (output_root / "images" / "AF").mkdir(parents=True, exist_ok=True)
    (output_root / "fields" / "NO").mkdir(parents=True, exist_ok=True)
    (output_root / "fields" / "AF").mkdir(parents=True, exist_ok=True)
    (output_root / "manifests").mkdir(parents=True, exist_ok=True)

    counts = {"NO": 0, "AF": 0}
    records: list[dict[str, Any]] = []
    pairs: list[dict[str, Any]] = []

    for case_index in range(1, template_cases + 1):
        values = base.make_pseudonym_case(case_index)
        for document_type, schema in schemas.items():
            counts["NO"] += 1
            no_dataset_id = f"NO_EXACT_COORD_{counts['NO']:04d}"
            no_rel_img = Path("images") / "NO" / f"{no_dataset_id}.png"
            no_image = base.draw_template(document_type, schema, values)
            base.save_png_with_metadata(
                no_image,
                output_root / no_rel_img,
                {
                    "fds_dataset_id": no_dataset_id,
                    "fds_prefix": "NO",
                    "dataset_version": DATASET_VERSION,
                    "coordinate_policy": "canonical_template_original_field_coordinates",
                    "pseudonymized": True,
                },
            )
            no_json = base.build_field_json(
                no_dataset_id,
                "NO",
                document_type,
                schema,
                values,
                _rel(no_rel_img),
                "paired_pristine_exact_coordinate",
                source={"source_family": "standard_template_synthetic", "coordinate_policy": "canonical_template_original_field_coordinates"},
            )
            no_json["dataset_version"] = DATASET_VERSION
            no_rel_field = Path("fields") / "NO" / f"{no_dataset_id}.json"
            _field_json_path(output_root, "NO", no_dataset_id).write_text(json.dumps(no_json, ensure_ascii=False, indent=2), encoding="utf-8")

            field_key, scenario_id, before, after, detector_features = choose_tamper_target(document_type, values)
            mutated_values = dict(values)
            mutated_values[field_key] = after
            spec = schema["fields"][field_key]
            bbox = list(spec.bbox)

            counts["AF"] += 1
            af_dataset_id = f"AF_EXACT_COORD_{counts['AF']:04d}"
            af_rel_img = Path("images") / "AF" / f"{af_dataset_id}.png"
            af_image = overwrite_value_in_same_bbox(no_image, bbox, after, spec.value_type)
            tamper_evidence = [
                {
                    "scenario_id": scenario_id,
                    "field_key": field_key,
                    "bbox": bbox,
                    "paired_no_bbox": no_json["fields"][field_key]["bbox"],
                    "original_pseudonymized_value": before,
                    "mutated_pseudonymized_value": after,
                    "detector_features": detector_features,
                    "evidence_type": "same_source_image_same_bbox_text_overwrite",
                    "coordinate_policy": "same_bbox_as_paired_no_original_field",
                    "overlay_or_shifted_box_used": False,
                    "severity": "high",
                }
            ]
            base.save_png_with_metadata(
                af_image,
                output_root / af_rel_img,
                {
                    "fds_dataset_id": af_dataset_id,
                    "fds_prefix": "AF",
                    "dataset_version": DATASET_VERSION,
                    "paired_no_dataset_id": no_dataset_id,
                    "tamper_evidence": tamper_evidence,
                    "pseudonymized": True,
                },
            )
            af_json = base.build_field_json(
                af_dataset_id,
                "AF",
                document_type,
                schema,
                mutated_values,
                _rel(af_rel_img),
                "paired_pristine_exact_coordinate",
                source={
                    "source_family": "standard_template_synthetic_adversarial",
                    "paired_no_dataset_id": no_dataset_id,
                    "paired_no_image_path": _rel(no_rel_img),
                    "paired_no_field_json_path": _rel(no_rel_field),
                    "coordinate_policy": "same_source_image_same_bbox_text_overwrite",
                },
                tamper_evidence=tamper_evidence,
            )
            af_json["dataset_version"] = DATASET_VERSION
            af_json["paired_no_dataset_id"] = no_dataset_id
            af_json["paired_no_image_path"] = _rel(no_rel_img)
            af_json["paired_no_field_json_path"] = _rel(no_rel_field)
            af_rel_field = Path("fields") / "AF" / f"{af_dataset_id}.json"
            _field_json_path(output_root, "AF", af_dataset_id).write_text(json.dumps(af_json, ensure_ascii=False, indent=2), encoding="utf-8")

            pair = {
                "pair_id": f"PAIR_EXACT_COORD_{counts['AF']:04d}",
                "document_type": document_type,
                "case_id": values["case_id"],
                "no_dataset_id": no_dataset_id,
                "af_dataset_id": af_dataset_id,
                "no_image_path": _rel(no_rel_img),
                "af_image_path": _rel(af_rel_img),
                "no_field_json_path": _rel(no_rel_field),
                "af_field_json_path": _rel(af_rel_field),
                "tampered_field": field_key,
                "bbox": bbox,
                "coordinate_policy": "AF overwrites the exact same field bbox on the paired NO source image",
            }
            pairs.append(pair)
            records.extend(
                [
                    {"dataset_id": no_dataset_id, "prefix": "NO", "document_type": document_type, "image_path": _rel(no_rel_img), "field_json_path": _rel(no_rel_field), "paired_dataset_id": af_dataset_id},
                    {"dataset_id": af_dataset_id, "prefix": "AF", "document_type": document_type, "image_path": _rel(af_rel_img), "field_json_path": _rel(af_rel_field), "paired_dataset_id": no_dataset_id, "scenario_id": scenario_id, "tampered_field": field_key},
                ]
            )

    manifest = {
        "version": DATASET_VERSION,
        "created_at": base.now_iso(),
        "counts": counts,
        "coordinate_contract": {
            "af_generation_method": "copy_paired_no_image_then_overwrite_target_field_bbox_only",
            "no_af_bbox_must_match": True,
            "shifted_box_or_new_coordinate_layout_allowed": False,
        },
        "schemas": {
            doc_type: {"name_ko": schema["name_ko"], "fields": {k: base.field_spec_to_dict(v) for k, v in schema["fields"].items()}}
            for doc_type, schema in schemas.items()
        },
        "records": records,
    }
    (output_root / "VERSION.json").write_text(
        json.dumps(
            {
                "version": DATASET_VERSION,
                "created_at": base.now_iso(),
                "previous_versions": ["insurance-fds-field-pseudonymized-v3.1-cell-aligned"],
                "major_changes": [
                    "paired_no_af_lineage",
                    "af_created_by_overwriting_same_bbox_on_paired_no_image",
                    "pixel_diff_validation_outside_bbox",
                    "no_shifted_box_coordinate_contract",
                ],
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    (output_root / "manifests" / "dataset_manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    (output_root / "manifests" / "pair_manifest.json").write_text(
        json.dumps({"version": DATASET_VERSION, "pairs": pairs}, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    base.write_excel(output_root / "indexes" / "field_level_index.xlsx", records)
    validation = validate_exact_coordinate_pairs(output_root)
    return {"version": DATASET_VERSION, "output_root": str(output_root), "counts": counts, "pairs": len(pairs), "validation": validation}


def _changed_bbox(no_path: Path, af_path: Path) -> list[int] | None:
    """두 이미지의 변경된 픽셀 영역 bbox를 계산한다."""

    diff = ImageChops.difference(Image.open(no_path).convert("RGB"), Image.open(af_path).convert("RGB"))
    bbox = diff.getbbox()
    return list(bbox) if bbox else None


def _bbox_contains(outer: list[int], inner: list[int] | None, padding: int = 12) -> bool:
    """inner bbox가 outer bbox 내부 또는 허용 padding 내부인지 확인한다."""

    if inner is None:
        return False
    return outer[0] - padding <= inner[0] and outer[1] - padding <= inner[1] and outer[2] + padding >= inner[2] and outer[3] + padding >= inner[3]


def validate_exact_coordinate_pairs(output_root: Path) -> dict[str, Any]:
    """생성된 모든 AF pair의 좌표 동일성과 이미지 diff 제한을 검증한다."""

    pair_manifest_path = output_root / "manifests" / "pair_manifest.json"
    pair_manifest = json.loads(pair_manifest_path.read_text(encoding="utf-8"))
    report: dict[str, Any] = {
        "version": DATASET_VERSION,
        "checked_pairs": 0,
        "bbox_mismatch_count": 0,
        "missing_pair_count": 0,
        "pixel_diff_outside_bbox_count": 0,
        "failures": [],
        "created_at": base.now_iso(),
    }

    for pair in pair_manifest.get("pairs", []):
        report["checked_pairs"] += 1
        no_field_path = output_root / pair["no_field_json_path"]
        af_field_path = output_root / pair["af_field_json_path"]
        no_image_path = output_root / pair["no_image_path"]
        af_image_path = output_root / pair["af_image_path"]
        if not (no_field_path.exists() and af_field_path.exists() and no_image_path.exists() and af_image_path.exists()):
            report["missing_pair_count"] += 1
            report["failures"].append({"pair_id": pair.get("pair_id"), "reason": "missing_pair_artifact"})
            continue

        no_json = json.loads(no_field_path.read_text(encoding="utf-8"))
        af_json = json.loads(af_field_path.read_text(encoding="utf-8"))
        evidence = af_json["tamper_evidence"][0]
        field_key = evidence["field_key"]
        no_bbox = no_json["fields"][field_key]["bbox"]
        af_bbox = af_json["fields"][field_key]["bbox"]
        evidence_bbox = evidence["bbox"]
        if no_bbox != af_bbox or no_bbox != evidence_bbox or evidence.get("overlay_or_shifted_box_used") is not False:
            report["bbox_mismatch_count"] += 1
            report["failures"].append(
                {"pair_id": pair.get("pair_id"), "reason": "bbox_mismatch", "no_bbox": no_bbox, "af_bbox": af_bbox, "evidence_bbox": evidence_bbox}
            )

        changed = _changed_bbox(no_image_path, af_image_path)
        if not _bbox_contains(evidence_bbox, changed):
            report["pixel_diff_outside_bbox_count"] += 1
            report["failures"].append({"pair_id": pair.get("pair_id"), "reason": "pixel_diff_outside_bbox", "bbox": evidence_bbox, "changed_bbox": changed})

    (output_root / "validation").mkdir(parents=True, exist_ok=True)
    (output_root / "validation" / "exact_coordinate_validation.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    return report


def parse_args() -> argparse.Namespace:
    """CLI 인자를 파싱한다."""

    parser = argparse.ArgumentParser(description="Generate exact-coordinate NO/AF insurance FDS pairs")
    parser.add_argument("--output-root", default="data/insurance-fds-generated/field-pseudonymized-v3.2-exact-coordinate-overwrite")
    parser.add_argument("--template-cases", type=int, default=8)
    parser.add_argument("--validate-only", action="store_true")
    return parser.parse_args()


def main() -> None:
    """CLI entrypoint."""

    args = parse_args()
    output_root = Path(args.output_root)
    if args.validate_only:
        result = validate_exact_coordinate_pairs(output_root)
    else:
        result = generate_exact_coordinate_dataset(output_root, template_cases=args.template_cases)
    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
