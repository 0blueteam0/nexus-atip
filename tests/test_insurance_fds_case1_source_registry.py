from __future__ import annotations

from pathlib import Path

from scripts.insurance_fds_case1_source_registry import (
    REQUIRED_CASE1_DOCUMENT_TYPES,
    build_case1_field_inventory,
    build_reviewed_source_registry,
    load_case1_source_candidates,
    validate_case1_registry,
)

FIXTURE_PATH = Path(
    "data/insurance-fds-generated/five-case-dataset-ko/"
    "케이스1_정상_실손보험_청구문서_사진_수집/"
    "케이스1_정상청구문서_수집_공식출처후보_초안.ko.json"
)


def test_should_build_reviewed_case1_registry_with_official_sources_and_human_review_policy():
    candidates = load_case1_source_candidates(FIXTURE_PATH)
    registry = build_reviewed_source_registry(candidates)

    assert registry["artifact"].endswith("검토등록부_v0_1")
    assert registry["case_family"] == "case1_normal_claim_document_collection"
    assert registry["human_review_required"] is True
    assert registry["privacy_policy"]["raw_personal_data_storage"] == "quarantine_only"
    assert registry["privacy_policy"]["training_promotion_rule"] == "pseudonymized_or_public_blank_form_only"

    accepted = [row for row in registry["reviewed_sources"] if row["review_status"] == "accepted"]
    assert len(accepted) >= 8
    assert all(row["korean_filename_prefix"].startswith("케이스1_정상청구문서_수집_출처") for row in accepted)
    assert all(row["source_authority_level"] in {"official", "quasi_official"} for row in accepted)
    assert all(row["use_for_case3_case5_grounding"] is True for row in accepted)

    covered = {doc for row in accepted for doc in row["covered_document_types"]}
    assert set(REQUIRED_CASE1_DOCUMENT_TYPES).issubset(covered)


def test_should_validate_case1_registry_for_required_document_coverage_and_high_fidelity_basis():
    registry = build_reviewed_source_registry(load_case1_source_candidates(FIXTURE_PATH))
    result = validate_case1_registry(registry)

    assert result["ok"] is True
    assert result["missing_document_types"] == []
    assert result["accepted_source_count"] >= 8
    assert result["case3_case5_grounding_ready"] is True
    assert result["high_fidelity_basis_ready"] is True


def test_should_build_case1_field_inventory_grouped_by_claim_document_type():
    registry = build_reviewed_source_registry(load_case1_source_candidates(FIXTURE_PATH))
    inventory = build_case1_field_inventory(registry)

    assert inventory["artifact"].endswith("필드인벤토리_v0_1")
    assert inventory["field_language"] == "ko"
    assert inventory["high_fidelity_usage"] == "case1_fields_define_normal_layout_and_semantic_constraints_for_case3_and_case5"

    by_type = {item["document_type"]: item for item in inventory["document_type_inventory"]}
    assert "보험금 청구서" in by_type
    assert "진료비 계산서·영수증" in by_type
    assert "처방전" in by_type
    assert "약제비 영수증" in by_type

    claim_fields = set(by_type["보험금 청구서"]["core_fields_ko"])
    assert {"피보험자", "청구담보", "보험금 지급계좌", "사고유형"}.issubset(claim_fields)

    receipt_constraints = by_type["진료비 계산서·영수증"]["normal_consistency_constraints"]
    assert any("총액" in rule and "본인부담" in rule for rule in receipt_constraints)
