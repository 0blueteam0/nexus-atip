#!/usr/bin/env python
"""실손보험 청구서류 FDS 합성 데이터 생성기.

이 스크립트는 실제 개인정보나 실제 병원 원문을 수집하지 않고, 방어적 FDS 학습과
검증에 사용할 수 있는 합성 문서 데이터를 여러 방식으로 생성한다. 한 가지 생성 방식에
의존하면 모델이 특정 렌더링 흔적만 외우는 문제가 생기므로, 같은 구조화 원천 데이터를
아래 네 가지 산출물로 동시에 만든다.

1. structured_json: OCR/KIE/룰엔진 학습용 정형 필드와 라벨
2. html_template: 브라우저/Playwright/WeasyPrint/PDF 렌더링으로 확장 가능한 문서 템플릿
3. svg_template: 좌표와 bbox가 명확한 벡터 문서 템플릿
4. diffusion_prompt_pack: ComfyUI/diffusers 같은 이미지 생성 도구에 넘길 수 있는 안전 prompt contract

중요한 안전 원칙:
- 실제 주민등록번호, 실제 계좌, 실제 병원 로고, 실제 의사 서명, 실제 직인을 생성하지 않는다.
- AF 라벨은 범죄 수행 매뉴얼이 아니라 탐지/검증 포인트를 표현하는 방어적 라벨이다.
- 모든 샘플은 synthetic namespace와 deterministic seed를 포함해 재현 가능하게 만든다.
"""

from __future__ import annotations

import argparse
import hashlib
import html
import json
import random
from dataclasses import dataclass
from datetime import date, timedelta
from pathlib import Path
from typing import Any


DOCUMENT_TYPES = [
    "medical_receipt",
    "medical_detail_statement",
    "prescription",
    "claim_form",
]

TAMPER_TYPES = [
    "AF_AMOUNT_INFLATION",
    "AF_CROSSDOC_DATE_CONFLICT",
    "AF_PROVIDER_ID_MISMATCH",
    "AF_DUPLICATE_RECEIPT_REUSE",
    "AF_ITEM_INSERTION",
    "AF_FONT_LAYOUT_ANOMALY",
    "AF_COMPRESSION_REGION_ANOMALY",
    "AF_COPYMOVE_FIELD_REGION",
]


@dataclass(frozen=True)
class GeneratedArtifact:
    """manifest에 기록할 개별 산출물 메타데이터."""

    item_id: str
    prefix: str
    document_type: str
    generation_method: str
    relative_path: str
    label_summary: dict[str, Any]


def stable_id(*parts: str, length: int = 12) -> str:
    """입력 문자열 조합으로 재현 가능한 짧은 ID를 만든다."""

    digest = hashlib.sha256("|".join(parts).encode("utf-8")).hexdigest()
    return digest[:length].upper()


def write_json(path: Path, data: Any) -> None:
    """JSON을 UTF-8, pretty format으로 저장한다."""

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2, sort_keys=True), encoding="utf-8")


def write_text(path: Path, content: str) -> None:
    """텍스트 산출물을 UTF-8로 저장한다."""

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def build_label_standard() -> dict[str, Any]:
    """AF 합성 데이터 라벨링 기준표를 만든다.

    기준표는 문서 단위, 필드 단위, 이미지 포렌식 단위, 문서 간 정합성 단위,
    청구 행태 단위의 다층 라벨을 포함한다. 모델 학습자는 이 기준표를 보고
    어떤 라벨이 어떤 증거와 연결되는지 추적할 수 있다.
    """

    return {
        "label_standard_version": "insurance-fds-af-labels-v1",
        "scope": "실손보험 청구서류 위조탐지 FDS용 합성/공개/정상 데이터 라벨 기준",
        "prefix_policy": {
            "NO": "정상 문서 또는 정상 합성 문서. 위변조 라벨은 없어야 하며 필드 정합성이 통과되어야 한다.",
            "FK": "실제 공개 판례/보도/수사자료/공개 위조 데이터셋에서 추상화한 위조·사기 사례. 원문 PII는 저장하지 않는다.",
            "AF": "방어적 탐지 목적으로 생성한 합성 이상/위변조 데이터. 생성 레시피와 seed를 반드시 기록한다.",
        },
        "label_levels": ["document", "field", "image_forensic", "cross_document", "claim_behavior"],
        "tamper_taxonomy": {
            "AF_AMOUNT_INFLATION": {
                "level": ["field", "cross_document"],
                "description": "청구금액, 본인부담금, 비급여 금액 등 금액 필드가 관련 항목 합계 또는 타 문서와 맞지 않는 합성 이상.",
                "required_evidence": ["field_ref", "original_synthetic_value", "mutated_value", "business_rule_id"],
                "detector_targets": ["numeric_consistency", "cross_doc_amount_match", "ocr_field_validation"],
            },
            "AF_CROSSDOC_DATE_CONFLICT": {
                "level": ["cross_document"],
                "description": "진료일, 처방일, 청구일, 발급일의 순서가 업무 규칙과 충돌하는 합성 이상.",
                "required_evidence": ["source_document", "target_document", "date_fields", "business_rule_id"],
                "detector_targets": ["temporal_rule_engine", "claim_sequence_anomaly"],
            },
            "AF_PROVIDER_ID_MISMATCH": {
                "level": ["field", "cross_document"],
                "description": "기관명, 요양기관기호 형식, 사업자번호 namespace가 문서 간 불일치하는 합성 이상.",
                "required_evidence": ["provider_field_refs", "mismatch_type", "namespace_policy"],
                "detector_targets": ["provider_master_match", "entity_resolution"],
            },
            "AF_DUPLICATE_RECEIPT_REUSE": {
                "level": ["claim_behavior", "cross_document"],
                "description": "동일 합성 영수증 번호/문서 fingerprint가 서로 다른 청구 컨텍스트에서 반복되는 이상.",
                "required_evidence": ["receipt_no", "document_fingerprint", "claim_group_id"],
                "detector_targets": ["duplicate_detection", "graph_link_analysis"],
            },
            "AF_ITEM_INSERTION": {
                "level": ["field", "document"],
                "description": "세부산정내역서에 항목이 삽입되어 영수증 합계와 충돌하거나 정책상 비정상 패턴을 만드는 합성 이상.",
                "required_evidence": ["line_item_ref", "inserted_item_type", "amount_delta"],
                "detector_targets": ["line_item_kie", "policy_rule_engine"],
            },
            "AF_FONT_LAYOUT_ANOMALY": {
                "level": ["image_forensic"],
                "description": "특정 필드 영역의 폰트, 정렬, baseline, 자간, 행간이 주변 영역과 다른 합성 시각 이상.",
                "required_evidence": ["bbox", "field_ref", "visual_anomaly_type"],
                "detector_targets": ["layout_anomaly", "font_consistency"],
            },
            "AF_COMPRESSION_REGION_ANOMALY": {
                "level": ["image_forensic"],
                "description": "문서 일부 영역의 압축/노이즈/블러 특성이 주변 영역과 다른 합성 포렌식 이상.",
                "required_evidence": ["mask_layer", "region_ref", "degradation_recipe_id"],
                "detector_targets": ["ela_like_signal", "noise_residual", "region_consistency"],
            },
            "AF_COPYMOVE_FIELD_REGION": {
                "level": ["image_forensic", "field"],
                "description": "방어적 탐지 학습을 위해 필드 영역 재사용 흔적을 mask로 표시한 합성 copy-move 계열 이상.",
                "required_evidence": ["source_bbox", "target_bbox", "mask_layer", "field_ref"],
                "detector_targets": ["copy_move_segmentation", "tamper_mask_detection"],
            },
        },
        "field_annotation_schema": {
            "field_ref": "문서 내 필드 고유 참조. 예: receipt.total_claim_amount",
            "bbox": "렌더링 좌표계 기준 [x, y, width, height]. structured_json만 있을 때는 logical_bbox 사용.",
            "value_type": ["date", "amount", "provider", "patient_alias", "diagnosis_code_synthetic", "line_item", "free_text"],
            "normalization": "금액은 integer KRW, 날짜는 YYYY-MM-DD, 기관/환자는 synthetic namespace.",
            "evidence_type": ["business_rule", "cross_document", "visual_region", "ocr_roundtrip", "behavior_graph"],
        },
        "privacy_rules": {
            "required_pii_status": ["synthetic_no_real_pii", "public_case_abstracted_no_raw_pii"],
            "forbidden": [
                "실제 주민등록번호",
                "실제 전화번호/주소/계좌번호",
                "실제 병원 로고/직인/의사서명 원본",
                "실제 환자 의료 원문",
                "실제 위조 수행 절차를 단계별로 재현하는 설명",
            ],
            "allowed": [
                "가상 환자 alias",
                "가상 기관명과 synthetic provider id",
                "방어적 라벨 및 검증 규칙",
                "비식별 공개 사례의 추상 taxonomy",
            ],
        },
        "qa_gates": {
            "minimum_required_annotations": 8,
            "required_checks": [
                "JSON schema parse",
                "prefix/file-name consistency",
                "pii_status validation",
                "tamper label evidence completeness",
                "NO sample business rules pass",
                "AF sample has at least one failing business or forensic rule",
                "split leakage check by claim_group_id",
                "generation_seed recorded",
            ],
            "human_review_policy": "운영 학습 전 AF/FK 라벨은 표본 10% 이상 이중 검수하고, 실제 PII 의심 샘플은 즉시 격리한다.",
        },
        "split_policy": {
            "unit": "claim_group_id",
            "default_ratio": {"train": 0.7, "val": 0.15, "test": 0.15},
            "leakage_guard": "같은 claim_group_id와 document_fingerprint는 하나의 split에만 배치한다.",
        },
    }


def synthetic_base_fields(rng: random.Random, document_type: str, index: int) -> dict[str, Any]:
    """실제 PII가 없는 상세 문서 필드를 생성한다."""

    visit_date = date(2026, 1, 3) + timedelta(days=rng.randint(0, 120))
    issue_date = visit_date + timedelta(days=rng.randint(0, 3))
    claim_date = issue_date + timedelta(days=rng.randint(1, 20))
    patient_alias = f"PAT-SYN-{stable_id(str(index), document_type, 'patient', length=8)}"
    provider_alias = f"SYN-CLINIC-{rng.randint(100, 999)}"
    provider_id = f"SYN-HIRA-{rng.randint(10000000, 99999999)}"
    receipt_no = f"RCP-SYN-{stable_id(document_type, str(index), str(rng.random()), length=10)}"
    covered = rng.randint(12_000, 90_000)
    uncovered = rng.randint(8_000, 180_000)
    patient_paid = covered + uncovered
    claim_amount = int(patient_paid * rng.choice([0.5, 0.7, 0.8, 0.9]))
    diagnosis_code = f"SYN-KCD-{rng.choice(['J00', 'M54', 'K29', 'S93', 'H10'])}"
    line_items = [
        {"item_ref": "line.consultation", "name": "synthetic_consultation_fee", "amount": covered // 3, "benefit_type": "급여"},
        {"item_ref": "line.procedure", "name": "synthetic_minor_procedure", "amount": covered - covered // 3, "benefit_type": "급여"},
        {"item_ref": "line.noncovered", "name": "synthetic_noncovered_care", "amount": uncovered, "benefit_type": "비급여"},
    ]
    return {
        "document_type": document_type,
        "patient_alias": patient_alias,
        "provider_alias": provider_alias,
        "provider_id": provider_id,
        "receipt_no": receipt_no,
        "visit_date": visit_date.isoformat(),
        "issue_date": issue_date.isoformat(),
        "claim_date": claim_date.isoformat(),
        "diagnosis_code_synthetic": diagnosis_code,
        "covered_amount": covered,
        "uncovered_amount": uncovered,
        "patient_paid_amount": patient_paid,
        "claim_amount": claim_amount,
        "line_items": line_items,
        "document_namespace": "insurance-fds-synthetic-v1",
    }


def build_business_checks(fields: dict[str, Any], prefix: str) -> list[dict[str, Any]]:
    """정상/이상 여부를 판단할 수 있는 업무 규칙 결과를 생성한다."""

    total_line_amount = sum(item["amount"] for item in fields["line_items"])
    checks = [
        {
            "rule_id": "BR_AMOUNT_PATIENT_PAID_EQUALS_LINE_SUM",
            "description": "본인부담 합계는 세부 항목 합계와 일치해야 한다.",
            "expected": fields["patient_paid_amount"],
            "observed": total_line_amount,
            "passed": fields["patient_paid_amount"] == total_line_amount,
        },
        {
            "rule_id": "BR_CLAIM_NOT_GREATER_THAN_PATIENT_PAID",
            "description": "청구금액은 본인부담 합계를 초과하지 않아야 한다.",
            "expected": "claim_amount <= patient_paid_amount",
            "observed": f"{fields['claim_amount']} <= {fields['patient_paid_amount']}",
            "passed": fields["claim_amount"] <= fields["patient_paid_amount"],
        },
        {
            "rule_id": "BR_DATE_VISIT_ISSUE_CLAIM_ORDER",
            "description": "진료일 <= 발급일 <= 청구일 순서가 유지되어야 한다.",
            "expected": "visit_date <= issue_date <= claim_date",
            "observed": f"{fields['visit_date']} <= {fields['issue_date']} <= {fields['claim_date']}",
            "passed": fields["visit_date"] <= fields["issue_date"] <= fields["claim_date"],
        },
    ]
    if prefix == "NO":
        return checks
    return checks


def mutate_for_af(fields: dict[str, Any], rng: random.Random, index: int) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    """AF 샘플용 합성 이상을 주입하고, 그에 대한 라벨 증거를 반환한다.

    설명은 탐지에 필요한 증거 중심으로만 기록한다. 실제 위조 제작 절차나 회피법은
    포함하지 않는다.
    """

    mutated = json.loads(json.dumps(fields, ensure_ascii=False))
    tamper_type = TAMPER_TYPES[index % len(TAMPER_TYPES)]
    labels: list[dict[str, Any]] = []

    if tamper_type == "AF_AMOUNT_INFLATION":
        original = mutated["claim_amount"]
        mutated["claim_amount"] = mutated["patient_paid_amount"] + rng.randint(10_000, 80_000)
        labels.append({
            "tamper_type": tamper_type,
            "field_ref": "receipt.claim_amount",
            "evidence_type": "business_rule",
            "original_synthetic_value": original,
            "mutated_value": mutated["claim_amount"],
            "business_rule_id": "BR_CLAIM_NOT_GREATER_THAN_PATIENT_PAID",
            "severity": "high",
        })
    elif tamper_type == "AF_CROSSDOC_DATE_CONFLICT":
        original = mutated["claim_date"]
        mutated["claim_date"] = (date.fromisoformat(mutated["visit_date"]) - timedelta(days=2)).isoformat()
        labels.append({
            "tamper_type": tamper_type,
            "field_ref": "claim.claim_date",
            "evidence_type": "cross_document",
            "original_synthetic_value": original,
            "mutated_value": mutated["claim_date"],
            "business_rule_id": "BR_DATE_VISIT_ISSUE_CLAIM_ORDER",
            "severity": "medium",
        })
    elif tamper_type == "AF_PROVIDER_ID_MISMATCH":
        original = mutated["provider_id"]
        mutated["provider_id"] = f"SYN-HIRA-MISMATCH-{rng.randint(1000, 9999)}"
        labels.append({
            "tamper_type": tamper_type,
            "field_ref": "provider.provider_id",
            "evidence_type": "cross_document",
            "original_synthetic_value": original,
            "mutated_value": mutated["provider_id"],
            "business_rule_id": "BR_PROVIDER_MASTER_MATCH",
            "severity": "medium",
        })
    elif tamper_type == "AF_DUPLICATE_RECEIPT_REUSE":
        original = mutated["receipt_no"]
        mutated["receipt_no"] = "RCP-SYN-DUPLICATE-CONTROL"
        labels.append({
            "tamper_type": tamper_type,
            "field_ref": "receipt.receipt_no",
            "evidence_type": "behavior_graph",
            "original_synthetic_value": original,
            "mutated_value": mutated["receipt_no"],
            "business_rule_id": "BR_RECEIPT_FINGERPRINT_UNIQUE_PER_CLAIM_GROUP",
            "severity": "medium",
        })
    else:
        original = mutated["patient_paid_amount"]
        inserted = rng.randint(15_000, 90_000)
        mutated["line_items"].append({
            "item_ref": "line.synthetic_inserted_noncovered",
            "name": "synthetic_inserted_line_for_detector_training",
            "amount": inserted,
            "benefit_type": "비급여",
        })
        labels.append({
            "tamper_type": "AF_ITEM_INSERTION" if tamper_type not in {"AF_FONT_LAYOUT_ANOMALY", "AF_COMPRESSION_REGION_ANOMALY", "AF_COPYMOVE_FIELD_REGION"} else tamper_type,
            "field_ref": "detail.line.synthetic_inserted_noncovered",
            "evidence_type": "visual_region" if "ANOMALY" in tamper_type or "COPYMOVE" in tamper_type else "business_rule",
            "original_synthetic_value": original,
            "mutated_value": original + inserted,
            "business_rule_id": "BR_AMOUNT_PATIENT_PAID_EQUALS_LINE_SUM",
            "severity": "low" if "FONT" in tamper_type else "medium",
        })
    return mutated, labels


def logical_bboxes(fields: dict[str, Any]) -> dict[str, list[int]]:
    """렌더러가 없어도 학습/검증에 쓸 수 있는 논리 bbox를 제공한다."""

    refs = [
        "provider.provider_alias",
        "provider.provider_id",
        "patient.patient_alias",
        "receipt.receipt_no",
        "receipt.visit_date",
        "receipt.issue_date",
        "claim.claim_date",
        "receipt.patient_paid_amount",
        "receipt.claim_amount",
        "diagnosis.diagnosis_code_synthetic",
    ]
    return {ref: [40, 60 + i * 32, 420, 24] for i, ref in enumerate(refs)}


def build_structured_doc(prefix: str, fields: dict[str, Any], labels: list[dict[str, Any]], seed: int, index: int) -> dict[str, Any]:
    """정형 JSON 문서 레코드를 만든다."""

    checks = build_business_checks(fields, prefix)
    bbox = logical_bboxes(fields)
    mask_layers = []
    for pos, label in enumerate(labels):
        mask_layers.append({
            "mask_id": f"mask-{pos + 1}",
            "field_ref": label["field_ref"],
            "mask_type": "logical_bbox_placeholder",
            "bbox": bbox.get(label["field_ref"], [60, 220 + pos * 40, 240, 28]),
            "purpose": "tamper localization label for defensive detector training",
        })
    if prefix == "NO":
        mask_layers.append({
            "mask_id": "mask-clean-page",
            "field_ref": "document.full_page",
            "mask_type": "clean_region_reference",
            "bbox": [0, 0, 794, 1123],
            "purpose": "normal document baseline region",
        })
    return {
        "schema_version": "insurance-fds-synthetic-document-v1",
        "document_label": prefix,
        "pii_status": "synthetic_no_real_pii",
        "synthetic_namespace": "insurance-fds-synthetic-v1",
        "generation_seed": seed,
        "claim_group_id": f"CG-{stable_id(fields['patient_alias'], fields['visit_date'], length=10)}",
        "document_fingerprint": stable_id(json.dumps(fields, sort_keys=True, ensure_ascii=False), prefix, str(index), length=20),
        "fields": fields,
        "field_annotations": [
            {"field_ref": ref, "bbox": box, "value_type": infer_value_type(ref), "source": "synthetic_generator"}
            for ref, box in bbox.items()
        ],
        "tamper_labels": labels,
        "business_rule_checks": checks,
        "forensic_annotations": {
            "coordinate_system": "logical_page_794x1123",
            "mask_layers": mask_layers,
            "degradation_recipe_id": "baseline-clean" if prefix == "NO" else "af-region-anomaly-placeholder",
            "ocr_roundtrip_required": True,
        },
        "qa_status": {
            "schema_parse": "pending_or_passed_by_validator",
            "human_review": "required_before_production_training",
            "notes": "합성 데이터이며 실제 환자/기관 정보가 아니다.",
        },
    }


def infer_value_type(field_ref: str) -> str:
    """필드 참조명으로 간단한 값 타입을 추론한다."""

    if "date" in field_ref:
        return "date"
    if "amount" in field_ref:
        return "amount"
    if "provider" in field_ref:
        return "provider"
    if "patient" in field_ref:
        return "patient_alias"
    if "diagnosis" in field_ref:
        return "diagnosis_code_synthetic"
    return "free_text"


def render_html(doc: dict[str, Any]) -> str:
    """HTML/CSS 기반 문서 템플릿을 만든다."""

    fields = doc["fields"]
    label = doc["document_label"]
    rows = "\n".join(
        f"<tr><td>{html.escape(item['name'])}</td><td>{html.escape(item['benefit_type'])}</td><td>{item['amount']:,}</td></tr>"
        for item in fields["line_items"]
    )
    tamper_badge = "정상(NO)" if label == "NO" else "합성 이상(AF) - 방어적 탐지 라벨 포함"
    return f"""<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<title>{label} {html.escape(fields['document_type'])}</title>
<style>
  body {{ font-family: Arial, 'Noto Sans KR', sans-serif; background: #f5f5f5; }}
  .page {{ width: 794px; min-height: 1123px; margin: 24px auto; padding: 42px; background: white; border: 1px solid #d0d0d0; }}
  .header {{ border-bottom: 2px solid #333; padding-bottom: 12px; }}
  .badge {{ float: right; border: 1px solid #555; padding: 4px 8px; font-size: 12px; }}
  .grid {{ display: grid; grid-template-columns: 180px 1fr; gap: 8px; margin-top: 20px; }}
  table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
  th, td {{ border: 1px solid #aaa; padding: 8px; text-align: left; }}
  .amount {{ text-align: right; font-weight: bold; }}
  .synthetic {{ color: #777; font-size: 12px; margin-top: 24px; }}
</style>
</head>
<body>
<div class="page" data-document-label="{label}" data-pii-status="synthetic_no_real_pii">
  <div class="header"><span class="badge">{tamper_badge}</span><h1>합성 실손보험 청구 근거서류</h1></div>
  <div class="grid">
    <b>가상 기관명</b><span>{html.escape(fields['provider_alias'])}</span>
    <b>가상 기관 ID</b><span>{html.escape(fields['provider_id'])}</span>
    <b>가상 환자 Alias</b><span>{html.escape(fields['patient_alias'])}</span>
    <b>합성 영수증 번호</b><span>{html.escape(fields['receipt_no'])}</span>
    <b>진료일</b><span>{fields['visit_date']}</span>
    <b>발급일</b><span>{fields['issue_date']}</span>
    <b>청구일</b><span>{fields['claim_date']}</span>
    <b>합성 진단코드</b><span>{fields['diagnosis_code_synthetic']}</span>
  </div>
  <table>
    <thead><tr><th>항목</th><th>급여구분</th><th>금액(KRW)</th></tr></thead>
    <tbody>{rows}</tbody>
  </table>
  <p class="amount">본인부담 합계: {fields['patient_paid_amount']:,} KRW</p>
  <p class="amount">청구금액: {fields['claim_amount']:,} KRW</p>
  <p class="synthetic">이 문서는 FDS 탐지 학습용 합성 데이터이며 실제 개인정보/실제 병원 원문을 포함하지 않는다.</p>
</div>
</body>
</html>
"""


def render_svg(doc: dict[str, Any]) -> str:
    """SVG 기반 벡터 문서 템플릿을 만든다."""

    fields = doc["fields"]
    label = doc["document_label"]
    title = f"{label} Synthetic Claim Evidence"
    lines = [
        ("기관", fields["provider_alias"]),
        ("기관ID", fields["provider_id"]),
        ("환자Alias", fields["patient_alias"]),
        ("영수증번호", fields["receipt_no"]),
        ("진료일", fields["visit_date"]),
        ("발급일", fields["issue_date"]),
        ("청구일", fields["claim_date"]),
        ("본인부담", f"{fields['patient_paid_amount']:,}"),
        ("청구금액", f"{fields['claim_amount']:,}"),
    ]
    text_nodes = []
    for i, (k, v) in enumerate(lines):
        y = 120 + i * 42
        text_nodes.append(f'<text x="60" y="{y}" font-size="18" font-family="Arial">{html.escape(k)}: {html.escape(str(v))}</text>')
    label_color = "#2e7d32" if label == "NO" else "#c62828"
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="794" height="1123" viewBox="0 0 794 1123">
  <rect x="0" y="0" width="794" height="1123" fill="#ffffff" stroke="#999999"/>
  <text x="60" y="62" font-size="28" font-family="Arial" font-weight="bold">{html.escape(title)}</text>
  <rect x="610" y="34" width="130" height="36" fill="{label_color}" opacity="0.15" stroke="{label_color}"/>
  <text x="625" y="58" font-size="18" font-family="Arial" fill="{label_color}">{label}</text>
  {''.join(text_nodes)}
  <rect x="56" y="90" width="620" height="430" fill="none" stroke="#dddddd"/>
  <text x="60" y="1070" font-size="12" font-family="Arial" fill="#777777">synthetic_no_real_pii / defensive FDS training only</text>
</svg>
"""


def build_diffusion_prompt(doc: dict[str, Any]) -> dict[str, Any]:
    """ComfyUI/diffusers에 연결 가능한 안전 prompt contract를 만든다."""

    label = doc["document_label"]
    return {
        "prompt_pack_version": "insurance-fds-diffusion-contract-v1",
        "document_label": label,
        "pii_status": "synthetic_no_real_pii",
        "allowed_use": "background/scan/lighting texture variation only; text semantics remain generated by structured template",
        "positive_prompt": (
            "Korean insurance claim support document, synthetic training sample, plain clinic receipt layout, "
            "neutral paper texture, office scanner lighting, no real logo, no real signature, no readable private personal information"
        ),
        "negative_prompt": (
            "real hospital logo, real doctor signature, real official seal, resident registration number, phone number, address, bank account, "
            "photorealistic private medical record, instructions for document forgery"
        ),
        "control_inputs": {
            "layout_source": "html_or_svg_template",
            "mask_policy": "only synthetic mask layers from manifest",
            "recommended_tools": ["ComfyUI", "diffusers", "ControlNet"],
        },
        "audit_fields": {
            "model_license_required": True,
            "workflow_json_required": True,
            "seed_required": True,
            "human_review_before_training": True,
        },
    }


def make_file_name(prefix: str, method: str, document_type: str, index: int, extension: str) -> str:
    """NO/AF prefix가 보이는 파일명을 만든다."""

    return f"{prefix}_{method.upper()}_{document_type.upper()}_{index:04d}.{extension}"


def generate(output: Path, count_per_template: int, seed: int) -> dict[str, Any]:
    """합성 데이터 묶음을 생성한다."""

    rng = random.Random(seed)
    output.mkdir(parents=True, exist_ok=True)
    artifacts: list[GeneratedArtifact] = []

    label_standard = build_label_standard()
    write_json(output / "labels" / "insurance_fds_af_labeling_standard.json", label_standard)
    write_text(output / "labels" / "INSURANCE_FDS_AF_LABELING_STANDARD.md", render_label_markdown(label_standard))

    for document_type in DOCUMENT_TYPES:
        for local_index in range(count_per_template):
            index = len(artifacts) + local_index + 1
            base_fields = synthetic_base_fields(rng, document_type, index)
            for prefix in ["NO", "AF"]:
                fields = base_fields
                labels: list[dict[str, Any]] = []
                if prefix == "AF":
                    fields, labels = mutate_for_af(base_fields, rng, index)
                doc = build_structured_doc(prefix, fields, labels, seed, index)

                structured_path = output / "structured" / prefix / make_file_name(prefix, "structured_json", document_type, index, "json")
                write_json(structured_path, doc)
                artifacts.append(to_artifact(output, structured_path, doc, "structured_json"))

                html_path = output / "html" / prefix / make_file_name(prefix, "html_template", document_type, index, "html")
                write_text(html_path, render_html(doc))
                artifacts.append(to_artifact(output, html_path, doc, "html_template"))

                svg_path = output / "svg" / prefix / make_file_name(prefix, "svg_template", document_type, index, "svg")
                write_text(svg_path, render_svg(doc))
                artifacts.append(to_artifact(output, svg_path, doc, "svg_template"))

                prompt_path = output / "prompts" / prefix / make_file_name(prefix, "diffusion_prompt_pack", document_type, index, "json")
                prompt_doc = build_diffusion_prompt(doc)
                write_json(prompt_path, prompt_doc)
                artifacts.append(to_artifact(output, prompt_path, doc, "diffusion_prompt_pack"))

    manifest = {
        "manifest_version": "insurance-fds-generated-manifest-v1",
        "seed": seed,
        "count_per_template": count_per_template,
        "privacy_summary": "All generated items use synthetic_no_real_pii and fake namespaces.",
        "items": [artifact.__dict__ for artifact in artifacts],
        "recommended_next_renderers": ["Playwright/Chromium", "PyMuPDF", "Pillow/OpenCV", "ComfyUI optional"],
    }
    write_json(output / "manifests" / "generated_manifest.json", manifest)
    split = build_split_manifest(artifacts)
    write_json(output / "manifests" / "split_manifest.json", split)
    return manifest


def to_artifact(output: Path, path: Path, doc: dict[str, Any], method: str) -> GeneratedArtifact:
    """문서/파일 조합을 manifest 항목으로 변환한다."""

    rel = path.relative_to(output).as_posix()
    return GeneratedArtifact(
        item_id=stable_id(rel, doc["document_fingerprint"], method, length=14),
        prefix=doc["document_label"],
        document_type=doc["fields"]["document_type"],
        generation_method=method,
        relative_path=rel,
        label_summary={
            "pii_status": doc["pii_status"],
            "tamper_count": len(doc["tamper_labels"]),
            "claim_group_id": doc["claim_group_id"],
            "business_rule_fail_count": sum(1 for check in doc["business_rule_checks"] if not check["passed"]),
        },
    )


def build_split_manifest(artifacts: list[GeneratedArtifact]) -> dict[str, list[str]]:
    """재현 가능한 train/val/test split을 만든다."""

    ids = sorted(artifact.item_id for artifact in artifacts)
    split = {"train": [], "val": [], "test": []}
    for item_id in ids:
        bucket = int(hashlib.sha256(item_id.encode("utf-8")).hexdigest()[:8], 16) % 100
        if bucket < 70:
            split["train"].append(item_id)
        elif bucket < 85:
            split["val"].append(item_id)
        else:
            split["test"].append(item_id)
    return split


def render_label_markdown(label_standard: dict[str, Any]) -> str:
    """라벨 기준표를 사람이 읽기 쉬운 Markdown으로 렌더링한다."""

    rows = []
    for label_id, spec in label_standard["tamper_taxonomy"].items():
        levels = ", ".join(spec["level"])
        targets = ", ".join(spec["detector_targets"])
        rows.append(f"| {label_id} | {levels} | {spec['description']} | {targets} |")
    return "\n".join([
        "# 실손보험 FDS AF 합성 데이터 라벨링 기준표",
        "",
        "이 문서는 합성 이상(AF) 데이터를 방어적으로 생성하고 검수하기 위한 기준표이다.",
        "실제 개인정보, 실제 병원 로고, 실제 서명/직인, 실제 환자 의료 원문은 금지한다.",
        "",
        "## Prefix 규칙",
        "",
        f"- NO: {label_standard['prefix_policy']['NO']}",
        f"- FK: {label_standard['prefix_policy']['FK']}",
        f"- AF: {label_standard['prefix_policy']['AF']}",
        "",
        "## 라벨 taxonomy",
        "",
        "| Label | Level | 기준 | 탐지 대상 |",
        "|---|---|---|---|",
        *rows,
        "",
        "## QA Gate",
        "",
        *[f"- {check}" for check in label_standard["qa_gates"]["required_checks"]],
        "",
        "## 금지 데이터",
        "",
        *[f"- {item}" for item in label_standard["privacy_rules"]["forbidden"]],
    ])


def parse_args() -> argparse.Namespace:
    """CLI 인자를 파싱한다."""

    parser = argparse.ArgumentParser(description="Generate synthetic insurance FDS document seed artifacts.")
    parser.add_argument("--output", type=Path, required=True, help="산출물 디렉터리")
    parser.add_argument("--count-per-template", type=int, default=2, help="문서 유형별 반복 생성 수")
    parser.add_argument("--seed", type=int, default=42, help="재현 가능한 난수 seed")
    return parser.parse_args()


def main() -> None:
    """CLI entrypoint."""

    args = parse_args()
    manifest = generate(args.output, args.count_per_template, args.seed)
    print(json.dumps({"generated_manifest": str(args.output / "manifests" / "generated_manifest.json"), "items": len(manifest["items"])}, ensure_ascii=False))


if __name__ == "__main__":
    main()
