from __future__ import annotations

import json
from pathlib import Path
from typing import Any


DOCUMENT_TYPE_FROM_KO = {
    "진료비계산서영수증": "medical_receipt",
    "진료비세부산정내역서": "detail_statement",
    "약제비영수증": "pharmacy_receipt",
    "처방전": "prescription",
    "진단서": "diagnosis_certificate",
    "통원확인서": "visit_confirmation",
    "보험금청구서": "claim_form",
}

OCR_HINT_TO_FIELD = {
    "총진료비": "total_medical_fee",
    "본인부담금": "patient_burden_total",
    "비급여금액": "noncovered_amount",
    "청구금액": "claimed_amount",
    "진료일자": "treatment_date",
    "발급일자": "document_no",
    "입원일자": "admission_date",
    "퇴원일자": "discharge_date",
    "영수증번호": "receipt_no",
    "진단명": "diagnosis_name",
    "질병분류기호": "disease_code",
    "발급기관명": "provider_name",
    "처방정보": "drug_name",
}


def map_ocr_hint_to_internal_field(field_hint_ko: str, text_redacted: str = "") -> str | None:
    """Map OCR/KIE Korean field hints to the internal STG attack field keys.

    OCR 단계는 PII 원문을 보존하지 않는 것이 기본입니다. 따라서 이 매핑은 원문 값을
    복원하려 하지 않고, `field_hint_ko`와 이미 비식별 처리된 `text_redacted`의 형태만 보고
    STG 공격 의도에 필요한 내부 필드명을 결정합니다. 금액/날짜처럼 label 없이 값만 잡힌
    토큰은 보수적으로 `claimed_amount`, `treatment_date`에 붙여서 후보가 되게 합니다.
    """

    hint = str(field_hint_ko or "").strip()
    text = str(text_redacted or "")
    if hint in OCR_HINT_TO_FIELD:
        return OCR_HINT_TO_FIELD[hint]
    if hint == "금액후보":
        return "claimed_amount"
    if hint == "날짜후보":
        return "treatment_date"
    if "원" in text or "," in text and any(ch.isdigit() for ch in text):
        return "claimed_amount"
    if "[날짜]" in text:
        return "treatment_date"
    return None


def _load_jsonl(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def _as_relative_to_root(path: Path, root: Path) -> str:
    try:
        return path.resolve().relative_to(root.resolve()).as_posix()
    except Exception:
        return path.as_posix()


def _normalized_bbox(raw: Any) -> list[int] | None:
    if not isinstance(raw, (list, tuple)) or len(raw) != 4:
        return None
    x1, y1, x2, y2 = [int(v) for v in raw]
    if x2 <= x1 or y2 <= y1:
        return None
    if x2 - x1 < 8 or y2 - y1 < 8:
        return None
    return [x1, y1, x2, y2]


def _is_value_like_for_field(field: str, token: dict[str, Any]) -> bool:
    """Return whether an OCR token can be used as a same-row value for a label field.

    실제 원문값은 저장하지 않는다는 전제에서, redacted text와 hint 형태만 봅니다. 이 함수는
    라벨 박스를 치환하지 않기 위한 보수적 게이트이며, 금액/날짜 같은 FDS 의도 필드에만
    값 후보를 붙입니다.
    """

    hint = str(token.get("field_hint_ko") or "")
    text = str(token.get("text_redacted") or "")
    if field in {"total_medical_fee", "patient_burden_total", "noncovered_amount", "claimed_amount"}:
        return hint == "금액후보" or "원" in text or ("," in text and any(ch.isdigit() for ch in text))
    if field in {"treatment_date", "admission_date", "discharge_date"}:
        return hint == "날짜후보" or "[날짜]" in text
    return False


def pair_label_value_tokens(tokens: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Promote right-side same-row OCR values to STG field bboxes.

    OCR이 `총진료비` 같은 label과 `128,000` 같은 value를 별도 토큰으로 잡으면, 위변조 의도와
    맞닿는 것은 label 문구가 아니라 value입니다. 따라서 label token은 field를 결정하는 앵커로만
    쓰고, 같은 행 오른쪽에 있는 가장 가까운 value-like token bbox를 STG 치환 대상으로 반환합니다.
    """

    normalized: list[dict[str, Any]] = []
    for token in tokens:
        bbox = _normalized_bbox(token.get("bbox_xyxy"))
        if bbox:
            normalized.append({**token, "_bbox": bbox})

    pairs: list[dict[str, Any]] = []
    used_value_ids: set[str] = set()
    label_tokens = [token for token in normalized if str(token.get("field_hint_ko") or "") in OCR_HINT_TO_FIELD]
    for label in sorted(label_tokens, key=lambda item: (item["_bbox"][1], item["_bbox"][0])):
        label_bbox = label["_bbox"]
        field = map_ocr_hint_to_internal_field(label.get("field_hint_ko", ""), label.get("text_redacted", ""))
        if not field:
            continue
        label_mid_y = (label_bbox[1] + label_bbox[3]) / 2
        candidates: list[tuple[int, dict[str, Any]]] = []
        for value in normalized:
            value_id = str(value.get("token_id") or id(value))
            if value is label or value_id in used_value_ids:
                continue
            value_bbox = value["_bbox"]
            value_mid_y = (value_bbox[1] + value_bbox[3]) / 2
            same_row = abs(label_mid_y - value_mid_y) <= max(12, (label_bbox[3] - label_bbox[1]) * 0.75)
            right_side = value_bbox[0] >= label_bbox[2]
            if same_row and right_side and _is_value_like_for_field(field, value):
                candidates.append((value_bbox[0] - label_bbox[2], value))
        if not candidates:
            continue
        _, value = sorted(candidates, key=lambda item: item[0])[0]
        value_id = str(value.get("token_id") or id(value))
        used_value_ids.add(value_id)
        pairs.append(
            {
                "field": field,
                "bbox": value["_bbox"],
                "critical": True,
                "source": "ocr_label_value_pair_bbox",
                "label_token_id": label.get("token_id"),
                "value_token_id": value.get("token_id"),
                "ocr_field_hint_ko": label.get("field_hint_ko"),
                "value_field_hint_ko": value.get("field_hint_ko"),
                "confidence": min(float(label.get("confidence") or 0), float(value.get("confidence") or 0)),
                "pairing_method": "same_row_right_value",
                "raw_value_retention": False,
            }
        )
    return pairs


def build_stg_manifest_from_ocr_profiles(collection_dir: str | Path, output_manifest_jsonl: str | Path) -> dict[str, Any]:
    """Build a STG-compatible NO manifest from real-web OCR profiles.

    입력은 `collect_real_insurance_claim_sources.py`의 quarantine manifest와
    `ocr_profile_real_web_document_candidates.py`가 만든 redacted OCR JSON입니다. 출력은 기존
    `build_field_candidate_pool()`이 읽을 수 있는 `manifest.v4.jsonl` 호환 행입니다.

    보안/품질 원칙:
    - OCR 원문값은 저장하거나 복원하지 않습니다.
    - pixel에는 마스크/블럭/합성전용/제출불가 문구를 추가하지 않습니다.
    - 실제 사용 전 `privacy_review_status`가 수동 검수/가명처리 상태인지 manifest로 추적합니다.
    """

    collection = Path(collection_dir)
    manifest_rows = _load_jsonl(collection / "real_web_source_candidates.manifest.jsonl")
    by_candidate_id = {str(row.get("candidate_id")): row for row in manifest_rows}
    ocr_dir = collection / "ocr_profiles" / "ocr_json"
    output_path = Path(output_manifest_jsonl)
    output_root = output_path.parent

    rows: list[dict[str, Any]] = []
    skipped_no_fields = 0
    for ocr_path in sorted(ocr_dir.glob("*.ocr.json")):
        payload = json.loads(ocr_path.read_text(encoding="utf-8"))
        candidate_id = str(payload.get("candidate_id") or ocr_path.stem.replace(".ocr", ""))
        source = by_candidate_id.get(candidate_id)
        if not source:
            continue
        local = source.get("local_path") or payload.get("source_image_path")
        if not local:
            continue
        local_path = Path(local)
        field_bboxes: list[dict[str, Any]] = []
        seen: set[tuple[str, tuple[int, int, int, int]]] = set()
        for pair in pair_label_value_tokens(payload.get("tokens", [])):
            key = (pair["field"], tuple(pair["bbox"]))
            if key in seen:
                continue
            seen.add(key)
            field_bboxes.append(pair)
        for token in payload.get("tokens", []):
            bbox = _normalized_bbox(token.get("bbox_xyxy"))
            field = map_ocr_hint_to_internal_field(token.get("field_hint_ko", ""), token.get("text_redacted", ""))
            if not bbox or not field:
                continue
            key = (field, tuple(bbox))
            if key in seen:
                continue
            seen.add(key)
            field_bboxes.append(
                {
                    "field": field,
                    "bbox": bbox,
                    "critical": True,
                    "source": "ocr_redacted_token_bbox",
                    "ocr_token_id": token.get("token_id"),
                    "ocr_field_hint_ko": token.get("field_hint_ko"),
                    "confidence": token.get("confidence"),
                    "raw_value_retention": False,
                }
            )
        if not field_bboxes:
            skipped_no_fields += 1
            continue
        doc_label = str(source.get("document_type_label_ko") or source.get("document_type_guess") or "")
        row = {
            "dataset_id": candidate_id,
            "claim_id": candidate_id,
            "label_family": "NO",
            "document_type": DOCUMENT_TYPE_FROM_KO.get(doc_label, str(source.get("document_type_guess") or "real_web_document")),
            "document_type_ko": doc_label or "문서유형미분류",
            "file_name": _as_relative_to_root(local_path, output_root),
            "source_url": source.get("image_url") or payload.get("image_url") or "",
            "source_page_url": source.get("page_url") or payload.get("page_url") or "",
            "source_collection_method": "real_web_ocr_field_bbox_bridge",
            "privacy_review_status": source.get("privacy_review_status") or "quarantine_requires_manual_pii_review",
            "privacy_state": "pseudonymized_rewrite_required",
            "pseudonymization_policy": "ocr_redacted_value_rewrite_only",
            "raw_value_retention": False,
            "field_bboxes": field_bboxes,
        }
        rows.append(row)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text("\n".join(json.dumps(row, ensure_ascii=False) for row in rows) + ("\n" if rows else ""), encoding="utf-8")
    return {
        "ok": bool(rows),
        "row_count": len(rows),
        "skipped_no_fields": skipped_no_fields,
        "output_manifest": str(output_path),
        "policy": "OCR redacted bbox bridge; same-coordinate pseudonymized rewrite only; no mask/block/synthetic-only/not-for-submission pixels.",
    }
