#!/usr/bin/env python
"""실손보험 FDS 5-case coverage 검증 유틸리티.

이 모듈은 실제 데이터 생성기가 아니라, 앞으로 붙을 수집기/사례조사기/국소위변조기/생성기가
사용자 정의 5가지 케이스를 빠뜨리지 않도록 막는 품질 게이트입니다.

쉽게 말해 이 파일은 다음 질문에 답합니다.
1. 정상 실손보험 청구 서류 수집 케이스가 따로 있는가?
2. 기존 편집도구 기반 위변조 사례조사/샘플 케이스가 따로 있는가?
3. Case 1에서 수집한 문서를 AI/코딩도구로 국소 위변조하는 케이스가 따로 있는가?
4. 실제/공식 문서 구조와 업무규칙을 근거로 한 고현실성 위변조 생성 케이스가 있는가?
5. Case 1에서 배운 한국어 필드/문서구조를 바탕으로 새 문서를 생성하는 케이스가 따로 있는가?

또한 과거 문제였던 다음 항목을 명시적으로 금지합니다.
- 디렉터리/파일명에 case가 드러나지 않는 산출물
- 모든 것을 LLM이 생성해 실제 보험사기/문서 위변조와 멀어지는 흐름
- 이미지 픽셀 안에 합성데이터/모델학습용/제출불가 같은 shortcut 문구 노출
- 검은 박스, 큰 흰색 덮개, 비현실적 블록
- 영문 필드명 중심 청구 문서
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


REQUIRED_CASE_FAMILIES: tuple[str, ...] = (
    "case1_normal_claim_document_collection",
    "case2_traditional_editor_tamper_case_study",
    "case3_ai_code_local_tamper_from_case1",
    "case4_real_grounded_genai_tamper_generation",
    "case5_llm_code_full_synthetic_generation_from_case1_learning",
)

FORBIDDEN_IMAGE_SHORTCUTS: list[str] = [
    "합성데이터/모델학습용/제출불가 같은 픽셀 내 문구",
    "검은 박스/큰 흰색 덮개/비현실적 블록",
    "영문 필드명 중심 문서",
    "case 라벨을 이미지 안에 직접 노출",
]

HIGH_FIDELITY_QUALITY_POLICY: dict[str, Any] = {
    "delivery_target": "금융회사 납품 수준의 FDS 학습/검증 이미지",
    "not_equal_to": "단순 고해상도",
    "definition": "위변조 의도가 정확히 구현되고 정상 문서의 나머지 부분이 깨지지 않는 것",
    "human_visual_review_required": True,
    "intent_implementation_required": True,
    "non_target_document_preservation_required": True,
    "review_dimensions": [
        "위변조 의도가 라벨과 이미지에 같은 의미로 반영되었는가",
        "목표 필드 외 정상 문서의 글자/표/배경/좌표/문서관계가 깨지지 않았는가",
        "보험사 실무자가 육안으로 보아도 저품질 조작처럼 보이지 않는가",
        "FDS 모델이 합성 표시/블록/영문 필드 같은 shortcut이 아니라 실제 위변조 신호를 배우는가",
    ],
}

HIGH_FIDELITY_QUALITY_GATES: dict[str, bool] = {
    "위변조_의도_구현_확인": True,
    "정상_문서_나머지_보존_확인": True,
    "사람_육안_검수_가능": True,
    "단순_해상도_기준_아님": True,
}

CASE_TRACK_CONTRACTS: dict[str, dict[str, Any]] = {
    "case1_normal_claim_document_collection": {
        "case_number": "case1",
        "plain_korean_role": "정상 실손보험 청구 서류와 사진을 수집하고 범위를 정하는 케이스",
        "training_balance_role": "normal_claim_collection_baseline",
        "generation_track": "capture_variation_and_pseudonymized_derivatives_only",
        "local_substitution_track": "field_inventory_and_source_coordinate_collection",
        "minimum_smoke_records": 1,
        "directory_prefix": "case1_normal_claim_document_collection",
        "filename_prefix": "CASE1_case1_normal_claim_document_collection",
        "korean_directory_prefix": "케이스1_정상_실손보험_청구문서_사진_수집",
        "korean_filename_prefix": "케이스1_정상청구문서_수집",
        "why_required_ko": "FDS가 무엇을 정상 제출 문서로 봐야 하는지 알아야 위변조도 구별할 수 있다.",
    },
    "case2_traditional_editor_tamper_case_study": {
        "case_number": "case2",
        "plain_korean_role": "기존 편집도구와 실제 위변조 사례를 조사해 편집도구식 위변조 샘플을 만드는 케이스",
        "training_balance_role": "traditional_editor_tool_tamper_case_study",
        "generation_track": "editor_tool_artifact_reproduction_from_case_study",
        "local_substitution_track": "paired_no_target_field_local_edit_with_editor_artifacts",
        "minimum_smoke_records": 1,
        "directory_prefix": "case2_traditional_editor_tamper_case_study",
        "filename_prefix": "CASE2_case2_traditional_editor_tamper_case_study",
        "korean_directory_prefix": "케이스2_기존편집도구_위변조_사례조사_샘플",
        "korean_filename_prefix": "케이스2_편집도구위변조_사례샘플",
        "why_required_ko": "포토샵/PDF편집기/모바일편집/스캔앱류의 실제 조작 방식과 흔적을 별도 케이스로 학습해야 한다.",
    },
    "case3_ai_code_local_tamper_from_case1": {
        "case_number": "case3",
        "plain_korean_role": "Case 1에서 수집한 문서를 AI/코딩도구로 국소 위변조하는 케이스",
        "training_balance_role": "ai_code_local_tamper_on_collected_case1_sources",
        "generation_track": "ai_code_assisted_local_field_rewrite",
        "local_substitution_track": "paired_case1_no_same_coordinate_local_tamper",
        "minimum_smoke_records": 1,
        "directory_prefix": "case3_ai_code_local_tamper_from_case1",
        "filename_prefix": "CASE3_case3_ai_code_local_tamper_from_case1",
        "korean_directory_prefix": "케이스3_수집문서기반_AI코딩도구_국소위변조",
        "korean_filename_prefix": "케이스3_AI코딩도구_국소위변조",
        "why_required_ko": "앞으로 AI/코딩도구가 기존 청구 이미지의 특정 필드만 정교하게 바꾸는 공격면을 학습해야 한다.",
    },
    "case4_real_grounded_genai_tamper_generation": {
        "case_number": "case4",
        "plain_korean_role": "실제/공식 문서 구조와 업무규칙을 근거로 고현실성 위변조 번들을 만드는 케이스",
        "training_balance_role": "real_grounded_genai_tamper_bundle",
        "generation_track": "real_official_schema_grounded_tamper_bundle_generation",
        "local_substitution_track": "real_schema_grounded_paired_local_edit_and_cross_document_mismatch",
        "minimum_smoke_records": 1,
        "directory_prefix": "case4_real_grounded_genai_tamper_generation",
        "filename_prefix": "CASE4_case4_real_grounded_genai_tamper_generation",
        "korean_directory_prefix": "케이스4_실제공식서류기반_청구번들_위변조",
        "korean_filename_prefix": "케이스4_실제근거_청구번들위변조",
        "why_required_ko": "단일 이미지가 아니라 실제 청구 번들의 문서 간 금액/날짜/진단/기관 일관성까지 학습해야 한다.",
    },
    "case5_llm_code_full_synthetic_generation_from_case1_learning": {
        "case_number": "case5",
        "plain_korean_role": "Case 1에서 배운 한국어 필드와 문서구조를 바탕으로 LLM/코딩도구가 새 문서를 생성하는 케이스",
        "training_balance_role": "full_synthetic_generation_limited_to_case1_learned_korean_fields",
        "generation_track": "llm_code_full_document_generation_from_case1_field_schema",
        "local_substitution_track": "not_primary_new_document_generation_only_but_must_reference_case1_field_schema",
        "minimum_smoke_records": 1,
        "directory_prefix": "case5_llm_code_full_synthetic_generation_from_case1_learning",
        "filename_prefix": "CASE5_case5_llm_code_full_synthetic_generation_from_case1_learning",
        "korean_directory_prefix": "케이스5_수집문서학습기반_LLM코딩도구_신규문서생성",
        "korean_filename_prefix": "케이스5_LLM코딩도구_신규문서생성",
        "why_required_ko": "새 문서 생성은 허용하되 Case 1에서 확인한 한국어 필드/서식 범위 안에서만 생성해야 실제 FDS 자료로 쓸 수 있다.",
    },
}


def load_taxonomy(path: str | Path) -> dict[str, Any]:
    """5-case taxonomy JSON을 UTF-8로 로드한다."""

    return json.loads(Path(path).read_text(encoding="utf-8"))


def _case_family_set(taxonomy: dict[str, Any]) -> set[str]:
    """taxonomy의 case_families에서 case_family 값만 추출한다."""

    return {str(case.get("case_family")) for case in taxonomy.get("case_families", [])}


def validate_five_case_coverage(taxonomy: dict[str, Any]) -> dict[str, Any]:
    """사용자가 재정의한 다섯 가지 case family가 모두 존재하는지 검증한다."""

    present = _case_family_set(taxonomy)
    required = set(REQUIRED_CASE_FAMILIES)
    missing = sorted(required - present)
    extra = sorted(present - required)
    return {
        "ok": not missing,
        "required_case_families": list(REQUIRED_CASE_FAMILIES),
        "present_case_families": sorted(present),
        "missing_case_families": missing,
        "extra_case_families": extra,
    }


def build_five_case_coverage_matrix(
    taxonomy: dict[str, Any],
    output_path: str | Path | None = None,
) -> dict[str, Any]:
    """5-case별 수집/사례조사/국소위변조/grounded 생성/full 생성 coverage matrix를 만든다."""

    validation = validate_five_case_coverage(taxonomy)
    case_by_family = {case["case_family"]: case for case in taxonomy.get("case_families", [])}
    cases: list[dict[str, Any]] = []

    for case_family in REQUIRED_CASE_FAMILIES:
        taxonomy_case = case_by_family.get(case_family, {})
        contract = CASE_TRACK_CONTRACTS[case_family]
        cases.append(
            {
                "case_family": case_family,
                "korean_name": taxonomy_case.get("korean_name", ""),
                "model_role": taxonomy_case.get("model_role", ""),
                "must_appear_in_dataset": True,
                **contract,
                "visible_document_fields_language": "ko",
                "forbidden_image_shortcuts": FORBIDDEN_IMAGE_SHORTCUTS,
                "high_fidelity_quality_gates": HIGH_FIDELITY_QUALITY_GATES,
                "required_korean_fields": taxonomy_case.get("required_korean_fields", []),
                "required_labels": taxonomy_case.get("required_labels", []),
                "allowed_artifact_examples": taxonomy_case.get("allowed_artifact_examples", []),
                "must_not_do": taxonomy_case.get("must_not_do", []),
            }
        )

    matrix = {
        "project": taxonomy.get("project", "insurance-fds-model-training-data"),
        "taxonomy_version": taxonomy.get("version", "unknown"),
        "coverage_policy": {
            "all_five_cases_required": True,
            "case_count": 5,
            "visible_document_fields_language": "ko",
            "case_must_be_visible_in_directory_and_filename": True,
            "llm_only_generation_is_not_primary_strategy": True,
            "case1_collection_is_required_before_case3_and_case5": True,
            "no_visible_training_or_synthetic_labels_on_image": True,
            "no_large_blocks_or_shortcut_marks_on_image": True,
            "high_fidelity_quality_policy": HIGH_FIDELITY_QUALITY_POLICY,
            "public_dataset_priority": taxonomy.get("public_dataset_policy", {}).get("priority", "auxiliary_only"),
            "api_default": taxonomy.get("api_call_policy", {}).get("default", "do_not_call"),
        },
        "validation": validation,
        "cases": cases,
    }

    if output_path is not None:
        out = Path(output_path)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(matrix, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    return matrix


def main() -> int:
    """CLI entrypoint: taxonomy를 검증하고 coverage report를 저장한다."""

    parser = argparse.ArgumentParser(description="Validate insurance FDS five-case coverage.")
    parser.add_argument(
        "--taxonomy",
        default="data/insurance-fds-generated/taxonomy/five_case_taxonomy_v0_2.json",
        help="Path to five_case_taxonomy_v0_2.json",
    )
    parser.add_argument(
        "--output",
        default="data/insurance-fds-generated/taxonomy/five_case_coverage_matrix_v0_2.json",
        help="Output path for coverage matrix JSON",
    )
    args = parser.parse_args()

    taxonomy = load_taxonomy(args.taxonomy)
    matrix = build_five_case_coverage_matrix(taxonomy, output_path=args.output)
    print(
        json.dumps(
            {
                "ok": matrix["validation"]["ok"],
                "output": args.output,
                "case_count": len(matrix["cases"]),
                "missing_case_families": matrix["validation"]["missing_case_families"],
            },
            ensure_ascii=False,
            indent=2,
        )
    )
    return 0 if matrix["validation"]["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
