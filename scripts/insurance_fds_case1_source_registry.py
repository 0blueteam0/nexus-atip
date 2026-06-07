from __future__ import annotations

import argparse
import json
from collections import OrderedDict
from datetime import datetime
from pathlib import Path
from typing import Any

REQUIRED_CASE1_DOCUMENT_TYPES: list[str] = [
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

OFFICIAL_DOMAIN_HINTS: dict[str, str] = {
    "hi.co.kr": "official",
    "meritzfire.com": "official",
    "kbinsure.co.kr": "official",
    "samsungfire.com": "official",
    "idbins.com": "official",
    "law.go.kr": "official",
    "hira.or.kr": "official",
    "knia.or.kr": "quasi_official",
    "silson24.or.kr": "quasi_official",
    "ktv.go.kr": "quasi_official",
}

DOCUMENT_KEYWORDS: dict[str, list[str]] = {
    "보험금 청구서": ["보험금 청구서", "보험금청구서", "청구서 양식", "청구서류 안내"],
    "진료비 계산서·영수증": ["진료비 계산서", "진료비계산", "진료비 영수증", "영수증"],
    "진료비 세부산정내역서": ["진료비 세부", "세부산정내역", "세부내역서"],
    "처방전": ["처방전"],
    "약제비 영수증": ["약제비", "약제비 영수증"],
    "진단서": ["진단서", "진단명"],
    "입퇴원확인서": ["입퇴원", "입·퇴원", "입원기간"],
    "통원확인서": ["통원확인서", "통원"],
    "의사소견서": ["소견서", "의사소견서"],
    "수술확인서": ["수술확인서", "수술비"],
}

FIELD_INVENTORY_SEED: dict[str, dict[str, list[str]]] = {
    "보험금 청구서": {
        "core_fields_ko": [
            "계약자", "피보험자", "수익자", "주민등록번호", "연락처", "사고유형", "치료형태", "청구담보", "보험금 지급계좌",
            "타보험 가입사항", "개인정보 처리 동의",
        ],
        "normal_consistency_constraints": [
            "피보험자와 진료/처방 문서의 환자명 또는 가명 매핑이 일치해야 한다.",
            "청구담보가 실손의료비인 경우 진료비 영수증 또는 약제비 영수증 등 의료비 증빙이 연결되어야 한다.",
            "보험금 지급계좌 예금주와 수익자 관계가 설명 가능해야 한다.",
        ],
    },
    "진료비 계산서·영수증": {
        "core_fields_ko": ["환자명", "진료일자", "발행일자", "요양기관명", "사업자등록번호", "영수증번호", "진료비 총액", "본인부담금", "공단부담금", "비급여금액", "수납금액"],
        "normal_consistency_constraints": [
            "진료비 총액은 본인부담금, 공단부담금, 비급여금액 등 세부 금액 관계와 설명 가능해야 한다.",
            "진료일자와 발행일자는 청구서의 사고/치료 기간과 모순되지 않아야 한다.",
            "요양기관명과 사업자등록번호가 다른 문서의 발급기관 정보와 충돌하지 않아야 한다.",
        ],
    },
    "진료비 세부산정내역서": {
        "core_fields_ko": ["환자명", "진료기간", "진료과목", "항목", "일자", "코드", "명칭", "금액", "급여", "비급여", "요양기관명"],
        "normal_consistency_constraints": [
            "세부산정내역서의 합계는 연결된 진료비 계산서·영수증의 금액 구조와 크게 모순되지 않아야 한다.",
            "진료기간은 영수증의 진료일자 또는 입원기간과 설명 가능해야 한다.",
        ],
    },
    "처방전": {
        "core_fields_ko": ["환자명", "교부일자", "처방일자", "질병분류기호", "의료기관명", "의사명", "약품명", "투약량", "투약일수"],
        "normal_consistency_constraints": [
            "처방일자는 진료일자와 같거나 근접해야 한다.",
            "질병분류기호 또는 진단명은 청구서/진단서의 질병 정보와 충돌하지 않아야 한다.",
            "처방 약품은 약제비 영수증의 약품 또는 조제 정보와 연결되어야 한다.",
        ],
    },
    "약제비 영수증": {
        "core_fields_ko": ["환자명", "조제일자", "약국명", "사업자등록번호", "약품명", "약제비 총액", "본인부담금", "비급여금액", "처방전 교부번호"],
        "normal_consistency_constraints": [
            "조제일자는 처방전의 처방일자와 같거나 합리적 근접 범위에 있어야 한다.",
            "약제비 총액과 본인부담금 관계가 영수증 내부에서 설명 가능해야 한다.",
        ],
    },
    "진단서": {
        "core_fields_ko": ["환자명", "생년월일", "진단명", "질병분류기호", "발병일", "진단일", "발행일자", "의료기관명", "의사명"],
        "normal_consistency_constraints": [
            "진단명과 질병분류기호가 처방전, 통원확인서, 입퇴원확인서의 병명 정보와 충돌하지 않아야 한다.",
            "발행일자는 진료/입원 기간 이후 또는 설명 가능한 시점이어야 한다.",
        ],
    },
    "입퇴원확인서": {
        "core_fields_ko": ["환자명", "입원일자", "퇴원일자", "입원기간", "진단명", "질병분류기호", "의료기관명", "발행일자"],
        "normal_consistency_constraints": [
            "입원일자는 퇴원일자보다 늦을 수 없다.",
            "입원기간과 입원진료비 영수증의 병실료/식대 산정 기간이 설명 가능해야 한다.",
        ],
    },
    "통원확인서": {
        "core_fields_ko": ["환자명", "통원일자", "진단명", "질병분류기호", "진료과", "의료기관명", "발행일자"],
        "normal_consistency_constraints": [
            "통원일자는 진료비 영수증의 진료일자와 연결되어야 한다.",
            "진단명은 청구서의 사고/질병 정보와 충돌하지 않아야 한다.",
        ],
    },
    "의사소견서": {
        "core_fields_ko": ["환자명", "소견내용", "진단명", "질병분류기호", "작성일자", "의료기관명", "의사명"],
        "normal_consistency_constraints": [
            "소견내용은 청구된 치료항목 또는 추가 심사 사유와 연결되어야 한다.",
            "작성일자는 관련 진료/검사 이후의 설명 가능한 시점이어야 한다.",
        ],
    },
    "수술확인서": {
        "core_fields_ko": ["환자명", "수술명", "수술일자", "진단명", "질병분류기호", "의료기관명", "의사명", "발행일자"],
        "normal_consistency_constraints": [
            "수술일자는 진료비 세부내역서의 수술/처치 항목과 연결되어야 한다.",
            "수술명과 진단명은 청구담보 및 진단서 정보와 충돌하지 않아야 한다.",
        ],
    },
}


def load_case1_source_candidates(path: Path | str) -> dict[str, Any]:
    return json.loads(Path(path).read_text(encoding="utf-8"))


def _authority_level(url: str) -> str:
    lowered = url.lower()
    for domain, level in OFFICIAL_DOMAIN_HINTS.items():
        if domain in lowered:
            return level
    return "unreviewed"


def _covered_document_types(candidate: dict[str, Any]) -> list[str]:
    haystack = f"{candidate.get('title', '')} {candidate.get('description', '')} {candidate.get('query', '')}".replace("ㆍ", "·")
    covered: list[str] = []
    for document_type, keywords in DOCUMENT_KEYWORDS.items():
        if any(keyword in haystack for keyword in keywords):
            covered.append(document_type)
    return covered


def _source_category(candidate: dict[str, Any]) -> str:
    title = candidate.get("title", "")
    url = candidate.get("url", "")
    if url.lower().endswith(".pdf") or "[PDF]" in title:
        return "blank_form_or_pdf"
    if "청구서류" in title or "안내" in title or "실손24" in title:
        return "claim_document_guidance"
    if "법령" in title or "고시" in title or "서식" in title:
        return "statutory_form_guidance"
    return "reference_only"


def build_reviewed_source_registry(candidate_doc: dict[str, Any]) -> dict[str, Any]:
    reviewed_sources: list[dict[str, Any]] = []
    seen: set[str] = set()
    ordinal = 1
    for candidate in candidate_doc.get("source_candidates", []):
        url = candidate.get("url", "")
        if not url or url in seen:
            continue
        seen.add(url)
        authority = _authority_level(url)
        covered = _covered_document_types(candidate)
        accepted = authority in {"official", "quasi_official"} and bool(covered)
        row = OrderedDict(
            [
                ("source_id", f"CASE1-SRC-{ordinal:04d}"),
                ("review_status", "accepted" if accepted else "rejected_or_reference"),
                ("source_authority_level", authority),
                ("source_category", _source_category(candidate)),
                ("title", candidate.get("title")),
                ("url", url),
                ("query", candidate.get("query")),
                ("covered_document_types", covered),
                ("korean_filename_prefix", f"케이스1_정상청구문서_수집_출처_{ordinal:04d}"),
                ("human_review_note", "공식/준공식 출처와 문서유형 coverage를 1차 기계검토했으며, 실제 다운로드/사용 전 사람 검토 필요"),
                ("use_for_case3_case5_grounding", accepted),
                ("download_or_ingest_policy", "public_blank_form_or_guidance_only; no_real_personal_data_without_quarantine"),
            ]
        )
        reviewed_sources.append(row)
        ordinal += 1

    return {
        "artifact": "케이스1_정상청구문서_수집_공식출처_검토등록부_v0_1",
        "case_family": "case1_normal_claim_document_collection",
        "created_at": datetime.now().isoformat(timespec="seconds"),
        "human_review_required": True,
        "privacy_policy": {
            "raw_personal_data_storage": "quarantine_only",
            "training_promotion_rule": "pseudonymized_or_public_blank_form_only",
            "visible_pixel_labels": "no_training_or_synthetic_shortcut_labels",
        },
        "required_document_types": REQUIRED_CASE1_DOCUMENT_TYPES,
        "reviewed_sources": reviewed_sources,
        "validation": validate_case1_registry({"reviewed_sources": reviewed_sources}),
    }


def validate_case1_registry(registry: dict[str, Any]) -> dict[str, Any]:
    accepted = [row for row in registry.get("reviewed_sources", []) if row.get("review_status") == "accepted"]
    covered = {doc for row in accepted for doc in row.get("covered_document_types", [])}
    missing = [doc for doc in REQUIRED_CASE1_DOCUMENT_TYPES if doc not in covered]
    official_count = sum(1 for row in accepted if row.get("source_authority_level") == "official")
    quasi_count = sum(1 for row in accepted if row.get("source_authority_level") == "quasi_official")
    return {
        "ok": not missing and len(accepted) >= 8 and official_count >= 5,
        "accepted_source_count": len(accepted),
        "official_source_count": official_count,
        "quasi_official_source_count": quasi_count,
        "covered_document_types": sorted(covered),
        "missing_document_types": missing,
        "case3_case5_grounding_ready": not missing,
        "high_fidelity_basis_ready": not missing and official_count >= 5,
    }


def build_case1_field_inventory(registry: dict[str, Any]) -> dict[str, Any]:
    accepted_sources_by_type: dict[str, list[str]] = {doc_type: [] for doc_type in REQUIRED_CASE1_DOCUMENT_TYPES}
    for row in registry.get("reviewed_sources", []):
        if row.get("review_status") != "accepted":
            continue
        for doc_type in row.get("covered_document_types", []):
            if doc_type in accepted_sources_by_type:
                accepted_sources_by_type[doc_type].append(row["source_id"])

    document_type_inventory = []
    for doc_type in REQUIRED_CASE1_DOCUMENT_TYPES:
        seed = FIELD_INVENTORY_SEED[doc_type]
        document_type_inventory.append(
            {
                "document_type": doc_type,
                "core_fields_ko": seed["core_fields_ko"],
                "normal_consistency_constraints": seed["normal_consistency_constraints"],
                "accepted_source_ids": accepted_sources_by_type.get(doc_type, []),
                "human_review_required": True,
                "case3_case5_usage": "정상 필드명, 정상 문서관계, 국소치환 목표 필드 후보, 신규 생성 schema의 기준으로 사용",
            }
        )

    return {
        "artifact": "케이스1_정상청구문서_수집_필드인벤토리_v0_1",
        "case_family": "case1_normal_claim_document_collection",
        "created_at": datetime.now().isoformat(timespec="seconds"),
        "field_language": "ko",
        "high_fidelity_usage": "case1_fields_define_normal_layout_and_semantic_constraints_for_case3_and_case5",
        "document_type_inventory": document_type_inventory,
    }


def write_registry_outputs(input_path: Path, output_dir: Path) -> dict[str, str]:
    output_dir.mkdir(parents=True, exist_ok=True)
    candidates = load_case1_source_candidates(input_path)
    registry = build_reviewed_source_registry(candidates)
    inventory = build_case1_field_inventory(registry)

    registry_path = output_dir / "케이스1_정상청구문서_수집_공식출처_검토등록부_v0_1.ko.json"
    inventory_path = output_dir / "케이스1_정상청구문서_수집_필드인벤토리_v0_1.ko.json"
    summary_path = output_dir / "케이스1_정상청구문서_수집_다음작업_요약_v0_1.ko.md"

    registry_path.write_text(json.dumps(registry, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    inventory_path.write_text(json.dumps(inventory, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    accepted = [row for row in registry["reviewed_sources"] if row["review_status"] == "accepted"]
    validation = registry["validation"]
    md = [
        "# 케이스1 정상청구문서 수집 다음작업 요약 v0.1",
        "",
        "## 현재 결론",
        "",
        f"- accepted source count: {validation['accepted_source_count']}",
        f"- official source count: {validation['official_source_count']}",
        f"- missing document types: {', '.join(validation['missing_document_types']) if validation['missing_document_types'] else '없음'}",
        "- Case 3/5 grounding ready: " + ("예" if validation["case3_case5_grounding_ready"] else "아니오"),
        "",
        "## accepted sources",
        "",
    ]
    for row in accepted:
        docs = ", ".join(row["covered_document_types"])
        md.append(f"- {row['source_id']} | {row['source_authority_level']} | {docs} | {row['title']} | {row['url']}")
    md.extend(
        [
            "",
            "## 다음 진행",
            "",
            "1. accepted source를 사람/법무/개인정보 기준으로 재검토한다.",
            "2. public blank form 또는 공식 안내만 download 후보로 승격한다.",
            "3. 실제 개인정보가 있는 문서/사진은 quarantine에만 두고, 학습 승격은 가명화/파생본만 허용한다.",
            "4. 필드 인벤토리를 기준으로 Case 3 국소치환 목표 필드와 Case 5 신규생성 schema를 만든다.",
        ]
    )
    summary_path.write_text("\n".join(md) + "\n", encoding="utf-8")
    return {"registry": str(registry_path), "inventory": str(inventory_path), "summary": str(summary_path)}


def main() -> None:
    parser = argparse.ArgumentParser(description="Build reviewed Case 1 normal claim document source registry and field inventory.")
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    args = parser.parse_args()
    outputs = write_registry_outputs(args.input, args.output_dir)
    print(json.dumps(outputs, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
