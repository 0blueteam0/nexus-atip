import json
from pathlib import Path

from scripts.insurance_fds_five_case_coverage import (
    REQUIRED_CASE_FAMILIES,
    build_five_case_coverage_matrix,
    load_taxonomy,
    validate_five_case_coverage,
)


TAXONOMY_PATH = Path("data/insurance-fds-generated/taxonomy/five_case_taxonomy_v0_2.json")


def test_should_require_all_five_user_cases_in_taxonomy():
    taxonomy = load_taxonomy(TAXONOMY_PATH)

    result = validate_five_case_coverage(taxonomy)

    assert result["ok"] is True
    assert list(REQUIRED_CASE_FAMILIES) == [
        "case1_normal_claim_document_collection",
        "case2_traditional_editor_tamper_case_study",
        "case3_ai_code_local_tamper_from_case1",
        "case4_real_grounded_genai_tamper_generation",
        "case5_llm_code_full_synthetic_generation_from_case1_learning",
    ]
    assert set(result["present_case_families"]) == set(REQUIRED_CASE_FAMILIES)
    assert result["missing_case_families"] == []


def test_should_make_directory_and_filename_case_prefixes_explicit_for_human_sorting():
    taxonomy = load_taxonomy(TAXONOMY_PATH)
    matrix = build_five_case_coverage_matrix(taxonomy)

    for case in matrix["cases"]:
        assert case["directory_prefix"].startswith(case["case_number"])
        assert case["filename_prefix"].startswith(case["case_number"].upper())
        assert case["case_family"] in case["directory_prefix"]
        assert case["case_family"] in case["filename_prefix"]


def test_should_require_korean_visible_document_fields_and_no_bad_visual_shortcuts():
    taxonomy = load_taxonomy(TAXONOMY_PATH)
    matrix = build_five_case_coverage_matrix(taxonomy)

    assert matrix["coverage_policy"]["visible_document_fields_language"] == "ko"
    assert matrix["coverage_policy"]["no_visible_training_or_synthetic_labels_on_image"] is True
    assert matrix["coverage_policy"]["no_large_blocks_or_shortcut_marks_on_image"] is True
    assert matrix["coverage_policy"]["llm_only_generation_is_not_primary_strategy"] is True

    for case in matrix["cases"]:
        assert case["visible_document_fields_language"] == "ko"
        assert case["forbidden_image_shortcuts"] == [
            "합성데이터/모델학습용/제출불가 같은 픽셀 내 문구",
            "검은 박스/큰 흰색 덮개/비현실적 블록",
            "영문 필드명 중심 문서",
            "case 라벨을 이미지 안에 직접 노출",
        ]


def test_should_separate_collection_study_local_tamper_grounded_generation_and_full_synthesis_roles():
    taxonomy = load_taxonomy(TAXONOMY_PATH)
    matrix = build_five_case_coverage_matrix(taxonomy)

    roles = {case["case_family"]: case["plain_korean_role"] for case in matrix["cases"]}

    assert roles["case1_normal_claim_document_collection"] == "정상 실손보험 청구 서류와 사진을 수집하고 범위를 정하는 케이스"
    assert roles["case2_traditional_editor_tamper_case_study"] == "기존 편집도구와 실제 위변조 사례를 조사해 편집도구식 위변조 샘플을 만드는 케이스"
    assert roles["case3_ai_code_local_tamper_from_case1"] == "Case 1에서 수집한 문서를 AI/코딩도구로 국소 위변조하는 케이스"
    assert roles["case4_real_grounded_genai_tamper_generation"] == "실제/공식 문서 구조와 업무규칙을 근거로 고현실성 위변조 번들을 만드는 케이스"
    assert roles["case5_llm_code_full_synthetic_generation_from_case1_learning"] == "Case 1에서 배운 한국어 필드와 문서구조를 바탕으로 LLM/코딩도구가 새 문서를 생성하는 케이스"


def test_should_have_physical_case_directories_with_korean_readme_for_future_outputs():
    taxonomy = load_taxonomy(TAXONOMY_PATH)
    matrix = build_five_case_coverage_matrix(taxonomy)
    root = Path("data/insurance-fds-generated/five-case-dataset")

    for case in matrix["cases"]:
        case_dir = root / case["directory_prefix"]
        readme_path = case_dir / "README.ko.md"
        assert case_dir.is_dir()
        assert readme_path.is_file()
        readme = readme_path.read_text(encoding="utf-8")
        assert case["case_family"] in readme
        assert "한국어 필드" in readme
        assert "이미지 픽셀 안에 합성/모델학습/제출불가 문구 금지" in readme


def test_should_define_high_fidelity_as_intent_and_non_target_preservation_not_resolution():
    taxonomy = load_taxonomy(TAXONOMY_PATH)
    matrix = build_five_case_coverage_matrix(taxonomy)

    policy = matrix["coverage_policy"]["high_fidelity_quality_policy"]
    assert policy["delivery_target"] == "금융회사 납품 수준의 FDS 학습/검증 이미지"
    assert policy["not_equal_to"] == "단순 고해상도"
    assert policy["definition"] == "위변조 의도가 정확히 구현되고 정상 문서의 나머지 부분이 깨지지 않는 것"
    assert policy["human_visual_review_required"] is True
    assert policy["intent_implementation_required"] is True
    assert policy["non_target_document_preservation_required"] is True

    for case in matrix["cases"]:
        assert case["high_fidelity_quality_gates"]["위변조_의도_구현_확인"] is True
        assert case["high_fidelity_quality_gates"]["정상_문서_나머지_보존_확인"] is True
        assert case["high_fidelity_quality_gates"]["사람_육안_검수_가능"] is True
        assert case["high_fidelity_quality_gates"]["단순_해상도_기준_아님"] is True


def test_should_define_korean_human_readable_directory_and_filename_prefixes():
    taxonomy = load_taxonomy(TAXONOMY_PATH)
    matrix = build_five_case_coverage_matrix(taxonomy)

    for case in matrix["cases"]:
        assert case["korean_directory_prefix"].startswith(case["case_number"].replace("case", "케이스"))
        assert case["korean_filename_prefix"].startswith(case["case_number"].replace("case", "케이스"))
        assert any("가" <= char <= "힣" for char in case["korean_directory_prefix"])
        assert any("가" <= char <= "힣" for char in case["korean_filename_prefix"])
        assert " " not in case["korean_directory_prefix"]
        assert " " not in case["korean_filename_prefix"]


def test_should_have_korean_physical_case_directories_and_human_review_artifacts():
    taxonomy = load_taxonomy(TAXONOMY_PATH)
    matrix = build_five_case_coverage_matrix(taxonomy)
    root = Path("data/insurance-fds-generated/five-case-dataset-ko")

    for case in matrix["cases"]:
        case_dir = root / case["korean_directory_prefix"]
        readme_path = case_dir / "README.ko.md"
        checklist_path = case_dir / f"{case['korean_filename_prefix']}_고충실도_육안검수_체크리스트.ko.md"
        plan_path = case_dir / f"{case['korean_filename_prefix']}_대표산출물_계획.ko.json"
        assert case_dir.is_dir()
        assert readme_path.is_file()
        assert checklist_path.is_file()
        assert plan_path.is_file()
        plan = json.loads(plan_path.read_text(encoding="utf-8"))
        assert plan["case_family"] == case["case_family"]
        assert len(plan["representative_output_cases"]) >= 5
        for output_case in plan["representative_output_cases"]:
            assert output_case["한글_파일명_prefix"].startswith(case["korean_filename_prefix"])
            assert output_case["고충실도_검증"]["위변조_의도_구현_확인"] is True
            assert output_case["고충실도_검증"]["정상_문서_나머지_보존_확인"] is True


def test_should_write_machine_readable_five_case_coverage_report(tmp_path):
    taxonomy = load_taxonomy(TAXONOMY_PATH)
    output_path = tmp_path / "five_case_coverage_report.json"

    matrix = build_five_case_coverage_matrix(taxonomy, output_path=output_path)

    saved = json.loads(output_path.read_text(encoding="utf-8"))
    assert saved == matrix
    assert saved["coverage_policy"]["all_five_cases_required"] is True
    assert saved["coverage_policy"]["case_count"] == 5
