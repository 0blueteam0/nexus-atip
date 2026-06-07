import json
from pathlib import Path

from scripts.insurance_fds_four_case_coverage import (
    REQUIRED_CASE_FAMILIES,
    build_four_case_coverage_matrix,
    load_taxonomy,
    validate_four_case_coverage,
)


TAXONOMY_PATH = Path("data/insurance-fds-generated/taxonomy/four_case_taxonomy.json")


def test_should_require_all_four_user_cases_in_taxonomy():
    taxonomy = load_taxonomy(TAXONOMY_PATH)

    result = validate_four_case_coverage(taxonomy)

    assert result["ok"] is True
    assert set(result["present_case_families"]) == set(REQUIRED_CASE_FAMILIES)
    assert result["missing_case_families"] == []


def test_should_map_generation_and_local_substitution_tracks_for_every_case():
    taxonomy = load_taxonomy(TAXONOMY_PATH)

    matrix = build_four_case_coverage_matrix(taxonomy)

    assert len(matrix["cases"]) == 4
    for case in matrix["cases"]:
        assert case["case_family"] in REQUIRED_CASE_FAMILIES
        assert case["training_balance_role"] in {
            "real_or_reference_source",
            "traditional_editor_tamper",
            "genai_existing_image_tamper",
            "real_grounded_genai_tamper",
        }
        assert case["generation_track"] in {
            "not_primary_but_may_generate_capture_or_pseudonymized_variants",
            "editor_artifact_generation",
            "genai_or_code_assisted_generation",
            "real_grounded_generation",
        }
        assert case["local_substitution_track"] in {
            "field_inventory_source_for_future_local_substitution",
            "paired_no_target_field_local_edit",
            "paired_no_genai_assisted_local_edit",
            "real_schema_grounded_paired_local_edit",
        }
        assert case["must_appear_in_dataset"] is True
        assert case["minimum_smoke_records"] >= 1


def test_should_write_machine_readable_coverage_report(tmp_path):
    taxonomy = load_taxonomy(TAXONOMY_PATH)
    output_path = tmp_path / "four_case_coverage_report.json"

    matrix = build_four_case_coverage_matrix(taxonomy, output_path=output_path)

    saved = json.loads(output_path.read_text(encoding="utf-8"))
    assert saved == matrix
    assert saved["coverage_policy"]["all_four_cases_required"] is True
    assert saved["coverage_policy"]["generation_and_local_substitution_both_considered"] is True
