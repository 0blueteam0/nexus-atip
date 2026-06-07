from __future__ import annotations

from pathlib import Path

from scripts.insurance_fds_case1_to_case3_case5_contract import (
    build_case3_local_tamper_targets,
    build_case5_generation_schema,
    load_case1_field_inventory,
    validate_case3_case5_contract,
)

INVENTORY_PATH = Path(
    "data/insurance-fds-generated/five-case-dataset-ko/"
    "케이스1_정상_실손보험_청구문서_사진_수집/"
    "케이스1_정상청구문서_수집_필드인벤토리_v0_1.ko.json"
)


def test_should_derive_case3_local_tamper_targets_from_case1_normal_fields():
    inventory = load_case1_field_inventory(INVENTORY_PATH)
    targets = build_case3_local_tamper_targets(inventory)

    assert targets["artifact"].endswith("국소위변조_목표필드계약_v0_1")
    assert targets["source_dependency"] == "case1_normal_claim_document_collection"
    assert targets["same_coordinate_policy"] == "AF must preserve NO field bounding box and non-target document regions"
    assert targets["visible_pixel_label_policy"] == "no_case_or_training_label_inside_image"

    by_field = {item["target_field_ko"]: item for item in targets["target_field_contracts"]}
    assert "청구금액" in by_field
    assert "진료비 총액" in by_field
    assert "진단명" in by_field
    assert "질병분류기호" in by_field
    assert "입원일자" in by_field

    amount_contract = by_field["청구금액"]
    assert amount_contract["high_fidelity_acceptance"]["intent_must_be_visible"] is True
    assert amount_contract["high_fidelity_acceptance"]["non_target_regions_must_be_preserved"] is True
    assert amount_contract["manifest_required_fields"] == [
        "paired_case1_no_dataset_id",
        "target_field_ko",
        "original_value",
        "mutated_value",
        "field_bbox_xyxy",
        "outside_target_changed_pixels",
        "ocr_before",
        "ocr_after",
    ]


def test_should_derive_case5_generation_schema_from_case1_document_types_and_korean_fields():
    inventory = load_case1_field_inventory(INVENTORY_PATH)
    schema = build_case5_generation_schema(inventory)

    assert schema["artifact"].endswith("신규생성_schema계약_v0_1")
    assert schema["source_dependency"] == "case1_normal_claim_document_collection"
    assert schema["generation_boundary"] == "new document generation only; not local tamper and not visible synthetic labeling"

    doc_schemas = {item["document_type"]: item for item in schema["document_generation_schemas"]}
    assert "보험금 청구서" in doc_schemas
    assert "진료비 계산서·영수증" in doc_schemas
    assert "처방전" in doc_schemas

    claim_schema = doc_schemas["보험금 청구서"]
    assert "피보험자" in claim_schema["required_visible_fields_ko"]
    assert "청구담보" in claim_schema["required_visible_fields_ko"]
    assert claim_schema["forbidden_shortcuts"] == [
        "합성데이터/모델학습용/제출불가 문구",
        "검은 박스/큰 흰색 덮개",
        "영문 필드명 중심 문서",
        "case 라벨 이미지 내 노출",
    ]


def test_should_validate_case3_and_case5_contracts_for_financial_company_delivery_quality():
    inventory = load_case1_field_inventory(INVENTORY_PATH)
    targets = build_case3_local_tamper_targets(inventory)
    schema = build_case5_generation_schema(inventory)
    result = validate_case3_case5_contract(targets, schema)

    assert result["ok"] is True
    assert result["case3_target_count"] >= 10
    assert result["case5_document_schema_count"] >= 10
    assert result["financial_delivery_quality_ready"] is True
    assert result["missing_case3_targets"] == []
    assert result["missing_case5_document_types"] == []
