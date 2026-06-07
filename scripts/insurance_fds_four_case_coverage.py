#!/usr/bin/env python
"""실손보험 FDS 4-case coverage 검증 유틸리티.

이 모듈은 데이터 생성기 자체가 아니라, 앞으로 어떤 데이터 생성/수집/편집 파이프라인을 붙이더라도
사용자가 고정한 네 가지 필수 케이스가 빠지지 않도록 확인하는 작은 품질 게이트입니다.

핵심 관점은 두 가지입니다.
1. 네 가지 케이스가 모두 dataset planning/manifest에 등장해야 합니다.
2. 각 케이스는 "처음부터 생성하는 축"과 "실제 이미지/문서 기반 국소치환 축" 중 어디에 속하는지
   명확히 라벨링되어야 합니다. 특히 Case 2/3/4는 paired NO 기반 local edit가 기본 검증 단위입니다.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


REQUIRED_CASE_FAMILIES: tuple[str, ...] = (
    "case1_real_claim_documents",
    "case2_traditional_editor_tamper",
    "case3_genai_or_code_assisted_existing_image_tamper",
    "case4_real_grounded_genai_tamper_generation",
)

CASE_TRACK_CONTRACTS: dict[str, dict[str, Any]] = {
    "case1_real_claim_documents": {
        "training_balance_role": "real_or_reference_source",
        "generation_track": "not_primary_but_may_generate_capture_or_pseudonymized_variants",
        "local_substitution_track": "field_inventory_source_for_future_local_substitution",
        "minimum_smoke_records": 1,
        "why_required_ko": "실제 실손 청구 서류 분포와 필드 구조가 없으면 FDS 모델이 정상 문서/제출채널을 학습할 수 없다.",
    },
    "case2_traditional_editor_tamper": {
        "training_balance_role": "traditional_editor_tamper",
        "generation_track": "editor_artifact_generation",
        "local_substitution_track": "paired_no_target_field_local_edit",
        "minimum_smoke_records": 1,
        "why_required_ko": "포토샵/PDF편집/스캔앱/모바일편집류의 실제 편집 흔적을 별도 클래스로 학습해야 한다.",
    },
    "case3_genai_or_code_assisted_existing_image_tamper": {
        "training_balance_role": "genai_existing_image_tamper",
        "generation_track": "genai_or_code_assisted_generation",
        "local_substitution_track": "paired_no_genai_assisted_local_edit",
        "minimum_smoke_records": 1,
        "why_required_ko": "LLM/코딩도구/생성형AI가 기존 청구 이미지의 필드만 바꾸는 흐름을 고품질로 모델링해야 한다.",
    },
    "case4_real_grounded_genai_tamper_generation": {
        "training_balance_role": "real_grounded_genai_tamper",
        "generation_track": "real_grounded_generation",
        "local_substitution_track": "real_schema_grounded_paired_local_edit",
        "minimum_smoke_records": 1,
        "why_required_ko": "실제/공식 청구서류의 레이아웃과 업무규칙을 grounding으로 한 생성형 위변조 케이스가 필요하다.",
    },
}


def load_taxonomy(path: str | Path) -> dict[str, Any]:
    """4-case taxonomy JSON을 UTF-8로 로드한다."""

    return json.loads(Path(path).read_text(encoding="utf-8"))


def _case_family_set(taxonomy: dict[str, Any]) -> set[str]:
    """taxonomy의 case_families에서 case_family 값만 추출한다."""

    return {str(case.get("case_family")) for case in taxonomy.get("case_families", [])}


def validate_four_case_coverage(taxonomy: dict[str, Any]) -> dict[str, Any]:
    """사용자가 지정한 네 가지 case family가 모두 존재하는지 검증한다."""

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


def build_four_case_coverage_matrix(
    taxonomy: dict[str, Any],
    output_path: str | Path | None = None,
) -> dict[str, Any]:
    """4-case별 생성/국소치환 coverage matrix를 만든다.

    Args:
        taxonomy: `four_case_taxonomy.json`에서 로드한 dict.
        output_path: 지정하면 matrix를 JSON 파일로 저장한다.

    Returns:
        모델 학습 데이터 구축 시 반드시 확인해야 하는 coverage matrix.
    """

    validation = validate_four_case_coverage(taxonomy)
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
                "required_labels": taxonomy_case.get("required_labels", []),
            }
        )

    matrix = {
        "project": taxonomy.get("project", "insurance-fds-model-training-data"),
        "taxonomy_version": taxonomy.get("version", "unknown"),
        "coverage_policy": {
            "all_four_cases_required": True,
            "generation_and_local_substitution_both_considered": True,
            "generation_is_not_the_only_strategy": True,
            "real_document_grounded_local_substitution_required": True,
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

    parser = argparse.ArgumentParser(description="Validate insurance FDS four-case coverage.")
    parser.add_argument(
        "--taxonomy",
        default="data/insurance-fds-generated/taxonomy/four_case_taxonomy.json",
        help="Path to four_case_taxonomy.json",
    )
    parser.add_argument(
        "--output",
        default="data/insurance-fds-generated/taxonomy/four_case_coverage_matrix_v0_1.json",
        help="Output path for coverage matrix JSON",
    )
    args = parser.parse_args()

    taxonomy = load_taxonomy(args.taxonomy)
    matrix = build_four_case_coverage_matrix(taxonomy, output_path=args.output)
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
