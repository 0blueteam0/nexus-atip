from __future__ import annotations

import argparse
import json
from datetime import datetime
from pathlib import Path
from typing import Any

REQUIRED_CASE3_TARGETS = [
    "청구금액",
    "진료비 총액",
    "본인부담금",
    "비급여금액",
    "진료일자",
    "처방일자",
    "진단명",
    "질병분류기호",
    "약품명",
    "입원일자",
    "퇴원일자",
]

CASE3_FIELD_ALIASES = {
    "청구금액": ["보험금 지급계좌", "청구담보"],
    "진료비 총액": ["진료비 총액", "약제비 총액"],
    "본인부담금": ["본인부담금"],
    "비급여금액": ["비급여금액"],
    "진료일자": ["진료일자", "통원일자"],
    "처방일자": ["처방일자", "교부일자", "조제일자"],
    "진단명": ["진단명"],
    "질병분류기호": ["질병분류기호"],
    "약품명": ["약품명"],
    "입원일자": ["입원일자", "입원기간"],
    "퇴원일자": ["퇴원일자", "입원기간"],
}

FORBIDDEN_SHORTCUTS = [
    "합성데이터/모델학습용/제출불가 문구",
    "검은 박스/큰 흰색 덮개",
    "영문 필드명 중심 문서",
    "case 라벨 이미지 내 노출",
]

REQUIRED_CASE5_DOCUMENT_TYPES = [
    "보험금 청구서",
    "진료비 계산서·영수증",
    "진료비 세부산정내역서",
    "처방전",
    "약제비 영수증",
    "진단서",
    "입퇴원확인서",
    "통원확인서",
    "의사소견서",
    "수술확인서",
]


def load_case1_field_inventory(path: Path | str) -> dict[str, Any]:
    return json.loads(Path(path).read_text(encoding="utf-8"))


def _inventory_by_document_type(inventory: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {item["document_type"]: item for item in inventory.get("document_type_inventory", [])}


def _document_types_containing_field(inventory: dict[str, Any], target_field: str) -> list[str]:
    aliases = CASE3_FIELD_ALIASES.get(target_field, [target_field])
    matches: list[str] = []
    for item in inventory.get("document_type_inventory", []):
        fields = set(item.get("core_fields_ko", []))
        if any(alias in fields for alias in aliases):
            matches.append(item["document_type"])
    return matches


def build_case3_local_tamper_targets(inventory: dict[str, Any]) -> dict[str, Any]:
    contracts = []
    for target in REQUIRED_CASE3_TARGETS:
        source_document_types = _document_types_containing_field(inventory, target)
        contracts.append(
            {
                "target_field_ko": target,
                "source_document_types": source_document_types,
                "operation_family": "same_coordinate_local_field_substitution",
                "high_fidelity_acceptance": {
                    "intent_must_be_visible": True,
                    "non_target_regions_must_be_preserved": True,
                    "human_visual_review_required": True,
                    "not_resolution_only": True,
                    "korean_visible_field_required": True,
                },
                "manifest_required_fields": [
                    "paired_case1_no_dataset_id",
                    "target_field_ko",
                    "original_value",
                    "mutated_value",
                    "field_bbox_xyxy",
                    "outside_target_changed_pixels",
                    "ocr_before",
                    "ocr_after",
                ],
                "failure_conditions": [
                    "대상 필드 좌표가 원본보다 밀림",
                    "대상 필드 외 표선/배경/다른 글자가 깨짐",
                    "문서 이미지 안에 AF/합성/모델학습 같은 shortcut label이 보임",
                    "OCR before/after가 target field 변화와 일치하지 않음",
                ],
            }
        )
    return {
        "artifact": "케이스3_AI코딩도구_국소위변조_목표필드계약_v0_1",
        "case_family": "case3_ai_code_local_tamper_from_case1",
        "created_at": datetime.now().isoformat(timespec="seconds"),
        "source_dependency": "case1_normal_claim_document_collection",
        "same_coordinate_policy": "AF must preserve NO field bounding box and non-target document regions",
        "visible_pixel_label_policy": "no_case_or_training_label_inside_image",
        "target_field_contracts": contracts,
    }


def build_case5_generation_schema(inventory: dict[str, Any]) -> dict[str, Any]:
    document_schemas = []
    for item in inventory.get("document_type_inventory", []):
        document_schemas.append(
            {
                "document_type": item["document_type"],
                "required_visible_fields_ko": item.get("core_fields_ko", []),
                "normal_consistency_constraints": item.get("normal_consistency_constraints", []),
                "accepted_source_ids": item.get("accepted_source_ids", []),
                "generation_acceptance": {
                    "looks_like_korean_insurance_claim_document": True,
                    "field_names_are_korean": True,
                    "internal_consistency_required": True,
                    "human_visual_review_required": True,
                    "not_resolution_only": True,
                },
                "forbidden_shortcuts": FORBIDDEN_SHORTCUTS,
            }
        )
    return {
        "artifact": "케이스5_LLM코딩도구_신규생성_schema계약_v0_1",
        "case_family": "case5_llm_code_full_synthetic_generation_from_case1_learning",
        "created_at": datetime.now().isoformat(timespec="seconds"),
        "source_dependency": "case1_normal_claim_document_collection",
        "generation_boundary": "new document generation only; not local tamper and not visible synthetic labeling",
        "document_generation_schemas": document_schemas,
    }


def validate_case3_case5_contract(case3_targets: dict[str, Any], case5_schema: dict[str, Any]) -> dict[str, Any]:
    present_targets = {item["target_field_ko"] for item in case3_targets.get("target_field_contracts", [])}
    present_docs = {item["document_type"] for item in case5_schema.get("document_generation_schemas", [])}
    missing_targets = [target for target in REQUIRED_CASE3_TARGETS if target not in present_targets]
    missing_docs = [doc for doc in REQUIRED_CASE5_DOCUMENT_TYPES if doc not in present_docs]
    all_case3_contracts_have_sources = all(
        item.get("source_document_types") for item in case3_targets.get("target_field_contracts", [])
    )
    all_case5_schemas_have_fields = all(
        item.get("required_visible_fields_ko") for item in case5_schema.get("document_generation_schemas", [])
    )
    ok = not missing_targets and not missing_docs and all_case3_contracts_have_sources and all_case5_schemas_have_fields
    return {
        "ok": ok,
        "case3_target_count": len(present_targets),
        "case5_document_schema_count": len(present_docs),
        "missing_case3_targets": missing_targets,
        "missing_case5_document_types": missing_docs,
        "case3_targets_have_case1_sources": all_case3_contracts_have_sources,
        "case5_schemas_have_korean_fields": all_case5_schemas_have_fields,
        "financial_delivery_quality_ready": ok,
    }


def write_case3_case5_contract_outputs(input_path: Path, case3_output_dir: Path, case5_output_dir: Path) -> dict[str, str]:
    inventory = load_case1_field_inventory(input_path)
    case3_targets = build_case3_local_tamper_targets(inventory)
    case5_schema = build_case5_generation_schema(inventory)
    validation = validate_case3_case5_contract(case3_targets, case5_schema)
    case3_targets["validation"] = validation
    case5_schema["validation"] = validation

    case3_output_dir.mkdir(parents=True, exist_ok=True)
    case5_output_dir.mkdir(parents=True, exist_ok=True)
    case3_path = case3_output_dir / "케이스3_AI코딩도구_국소위변조_목표필드계약_v0_1.ko.json"
    case5_path = case5_output_dir / "케이스5_LLM코딩도구_신규문서생성_schema계약_v0_1.ko.json"
    summary_path = case5_output_dir / "케이스3_케이스5_Case1기반_연결요약_v0_1.ko.md"

    case3_path.write_text(json.dumps(case3_targets, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    case5_path.write_text(json.dumps(case5_schema, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    md = [
        "# 케이스3/케이스5 Case 1 기반 연결요약 v0.1",
        "",
        "## 의미",
        "",
        "Case 3와 Case 5는 이제 Case 1 정상 문서 필드 인벤토리를 직접 참조합니다.",
        "Case 3는 같은 좌표 국소치환 대상 필드를 정의하고, Case 5는 신규 문서 생성 schema를 정의합니다.",
        "",
        "## 검증 결과",
        "",
        f"- ok: {validation['ok']}",
        f"- case3 target count: {validation['case3_target_count']}",
        f"- case5 document schema count: {validation['case5_document_schema_count']}",
        f"- financial delivery quality ready: {validation['financial_delivery_quality_ready']}",
        "",
        "## 고충실도 기준",
        "",
        "- Case 3: AF는 NO와 같은 필드 좌표를 유지하고 목표 필드 외 정상 문서 영역을 보존해야 합니다.",
        "- Case 5: 신규 문서 생성물은 한국어 필드와 정상 문서관계를 가져야 하며, 이미지 안에 합성/모델학습/제출불가 문구를 넣지 않습니다.",
    ]
    summary_path.write_text("\n".join(md) + "\n", encoding="utf-8")
    return {"case3_targets": str(case3_path), "case5_schema": str(case5_path), "summary": str(summary_path)}


def main() -> None:
    parser = argparse.ArgumentParser(description="Build Case 3 local tamper and Case 5 generation contracts from Case 1 inventory.")
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--case3-output-dir", type=Path, required=True)
    parser.add_argument("--case5-output-dir", type=Path, required=True)
    args = parser.parse_args()
    print(json.dumps(write_case3_case5_contract_outputs(args.input, args.case3_output_dir, args.case5_output_dir), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
