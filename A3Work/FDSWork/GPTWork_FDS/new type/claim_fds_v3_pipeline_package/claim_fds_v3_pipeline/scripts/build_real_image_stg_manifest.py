from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Callable, Iterable

from PIL import Image

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tif", ".tiff"}

NON_DOCUMENT_NOISE_TERMS = [
    "panda",
    "profile",
    "banner",
    "avatar",
    "logo",
    "icon",
    "stock",
    "shutterstock",
    "adobestock",
    "gettyimages",
    "istockphoto",
    "푸바오",
    "판다",
    "프로필",
    "배너",
    "로고",
    "아이콘",
    "스톡",
]

DOCUMENT_TYPE_LABEL_BY_FIELD = {
    "patient_burden_total": "medical_receipt",
    "total_medical_fee": "medical_receipt",
    "noncovered_amount": "medical_detail_statement",
    "treatment_date": "medical_receipt",
    "disease_code": "diagnosis_certificate",
    "line_item_name": "medical_detail_statement",
}


@dataclass(frozen=True)
class TokenCandidate:
    text_redacted: str
    bbox_xyxy: list[int]
    confidence: float
    field_name: str | None
    reject_reason: str


def redact_token(text: str) -> str:
    """민감 원문값 저장을 피하기 위한 최소 비식별화입니다.

    STG 국소치환은 픽셀 패치를 사용하므로 manifest에 OCR 원문값을 보존할 필요가 없습니다.
    날짜/전화/주민번호/긴 숫자는 값 자체 대신 유형만 남겨 재식별 가능성을 줄입니다.
    """

    value = str(text or "")
    value = re.sub(r"\b\d{6}-?\d{7}\b", "[비식별-주민번호후보]", value)
    value = re.sub(r"\b01[016789]-?\d{3,4}-?\d{4}\b", "[비식별-전화번호후보]", value)
    value = re.sub(r"\b\d{4}[./-]\d{1,2}[./-]\d{1,2}\b", "[날짜]", value)
    value = re.sub(r"\b\d{1,3}(?:,\d{3})+\b", "[금액]", value)
    return value[:80]


def classify_ocr_token_for_stg(text: str) -> str | None:
    """OCR 토큰을 STG가 이해하는 내부 필드명으로 보수적으로 매핑합니다.

    노이즈 필터가 우선입니다. 판다/프로필/배너/스톡 계열은 숫자나 한글이 섞여도 문서 필드로
    쓰지 않습니다. 한국어 OCR이 깨진 실제 영수증 이미지도 금액/날짜/코드/수가 항목은 좌표가
    유용하므로 값 자체를 저장하지 않고 필드 유형만 매핑합니다.
    """

    raw = str(text or "").strip()
    if not raw:
        return None
    lowered = raw.lower()
    if any(term in lowered for term in NON_DOCUMENT_NOISE_TERMS):
        return None
    compact = re.sub(r"\s+", "", raw)
    if any(term in compact for term in ["본인부담", "환자부담", "납부", "수납", "청구금액"]):
        return "patient_burden_total"
    if any(term in compact for term in ["총진료비", "진료비총액", "합계"]):
        return "total_medical_fee"
    if "비급여" in compact:
        return "noncovered_amount"
    if re.search(r"\b\d{4}[./-]\d{1,2}[./-]\d{1,2}\b|\b\d{1,2}[./-]\d{1,2}\b", compact):
        return "treatment_date"
    if re.search(r"\b[A-Z][0-9]{2}(?:\.[0-9A-Z]+)?\b", compact, flags=re.I):
        return "disease_code"
    if re.search(r"\d{1,3}(?:[, .]\d{3})+|\d+원", compact):
        return "patient_burden_total"
    if compact.upper() in {"MRI", "CT", "XRAY", "X-RAY", "MRA", "SONO"}:
        return "line_item_name"
    return None


def _normalize_bbox(raw: Any, width: int, height: int) -> list[int] | None:
    if not isinstance(raw, (list, tuple)) or len(raw) != 4:
        return None
    try:
        x1, y1, x2, y2 = [int(round(float(v))) for v in raw]
    except Exception:
        return None
    x1 = max(0, min(width - 1, x1))
    y1 = max(0, min(height - 1, y1))
    x2 = max(x1 + 1, min(width, x2))
    y2 = max(y1 + 1, min(height, y2))
    if x2 - x1 < 10 or y2 - y1 < 8:
        return None
    if (x2 - x1) * (y2 - y1) > width * height * 0.18:
        return None
    return [x1, y1, x2, y2]


def polygon_to_xyxy(poly: Any) -> list[int] | None:
    try:
        xs = [int(round(float(p[0]))) for p in poly]
        ys = [int(round(float(p[1]))) for p in poly]
    except Exception:
        return None
    if not xs or not ys:
        return None
    return [min(xs), min(ys), max(xs), max(ys)]


def default_ocr_runner(image_path: Path) -> list[dict[str, Any]]:
    """RapidOCR 결과를 공통 token dict로 변환합니다.

    원문 OCR은 반환 직후 필드 유형/좌표 추출에만 쓰고, manifest에는 redacted/hash 중심으로만
    남깁니다. 모델이 없거나 OCR이 실패하면 빈 후보로 처리해 작업 전체를 중단하지 않습니다.
    """

    try:
        from rapidocr_onnxruntime import RapidOCR

        result, _ = RapidOCR()(str(image_path))
    except Exception:
        return []
    tokens: list[dict[str, Any]] = []
    for item in result or []:
        if len(item) < 3:
            continue
        bbox = polygon_to_xyxy(item[0])
        if not bbox:
            continue
        tokens.append({"text": str(item[1]), "bbox_xyxy": bbox, "confidence": float(item[2])})
    return tokens


def iter_images(image_dir: Path) -> Iterable[Path]:
    return sorted(p for p in image_dir.rglob("*") if p.suffix.lower() in IMAGE_EXTENSIONS and p.is_file())


def _image_document_shape_ok(width: int, height: int) -> bool:
    if min(width, height) < 260 or max(width, height) < 520:
        return False
    ratio = max(width, height) / max(1, min(width, height))
    return 1.05 <= ratio <= 4.2


def _sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def build_real_image_stg_manifest(
    image_dir: str | Path,
    output_dir: str | Path,
    *,
    ocr_runner: Callable[[Path], list[dict[str, Any]]] = default_ocr_runner,
    min_fields_per_image: int = 2,
) -> dict[str, Any]:
    """Real Image 폴더를 STG 입력용 NO manifest로 변환합니다.

    결과물은 원본 이미지를 그대로 복사하고 좌표 후보만 생성합니다. 마스크/블럭/합성전용 표시를
    만들지 않으며, 실제 국소치환은 `generate_stg_local_tamper_dataset`가 같은 좌표에 수행합니다.
    """

    src_dir = Path(image_dir)
    out_dir = Path(output_dir)
    copied_dir = out_dir / "images"
    report_dir = out_dir / "reports"
    if out_dir.exists():
        shutil.rmtree(out_dir)
    copied_dir.mkdir(parents=True, exist_ok=True)
    report_dir.mkdir(parents=True, exist_ok=True)

    rows: list[dict[str, Any]] = []
    profile_rows: list[dict[str, Any]] = []
    noise_rejected = 0
    field_candidate_count = 0
    source_images = list(iter_images(src_dir))

    for idx, image_path in enumerate(source_images, start=1):
        try:
            with Image.open(image_path) as img:
                width, height = img.size
                img.verify()
        except Exception as exc:
            profile_rows.append({"source_image_path": str(image_path.as_posix()), "accepted": False, "reject_reason": f"invalid_image:{type(exc).__name__}"})
            continue
        if not _image_document_shape_ok(width, height):
            profile_rows.append({"source_image_path": str(image_path.as_posix()), "accepted": False, "reject_reason": "shape_not_document_like", "width": width, "height": height})
            continue

        tokens = ocr_runner(image_path)
        field_boxes: list[dict[str, Any]] = []
        token_profiles: list[dict[str, Any]] = []
        for token_idx, token in enumerate(tokens, start=1):
            text = str(token.get("text") or "")
            conf = float(token.get("confidence") or 0.0)
            bbox = _normalize_bbox(token.get("bbox_xyxy"), width, height)
            field_name = classify_ocr_token_for_stg(text)
            if not bbox or not field_name or conf < 0.25:
                noise_rejected += 1
                token_profiles.append(
                    asdict(TokenCandidate(redact_token(text), bbox or [], round(conf, 4), field_name, "noise_or_low_confidence_or_bad_bbox"))
                )
                continue
            field_boxes.append({"field": field_name, "bbox": bbox, "critical": True, "token_id": f"T{token_idx:04d}"})
            token_profiles.append(asdict(TokenCandidate(redact_token(text), bbox, round(conf, 4), field_name, "")))

        # 같은 필드가 너무 많으면 좌표가 뚜렷한 앞쪽 후보 위주로 제한합니다. STG donor 다양성은 이미지 간 조합으로 확보합니다.
        deduped: list[dict[str, Any]] = []
        seen_boxes: set[tuple[str, tuple[int, int, int, int]]] = set()
        for item in field_boxes:
            key = (item["field"], tuple(item["bbox"]))
            if key in seen_boxes:
                continue
            seen_boxes.add(key)
            deduped.append(item)
            if len(deduped) >= 20:
                break
        field_boxes = deduped
        field_candidate_count += len(field_boxes)
        accepted = len(field_boxes) >= min_fields_per_image
        profile_rows.append(
            {
                "source_image_path": str(image_path.as_posix()),
                "accepted": accepted,
                "reject_reason": "" if accepted else "insufficient_stg_field_candidates",
                "width": width,
                "height": height,
                "token_count": len(tokens),
                "field_candidate_count": len(field_boxes),
                "token_profiles": token_profiles,
            }
        )
        if not accepted:
            continue

        digest = _sha256_file(image_path)
        ext = ".jpg" if image_path.suffix.lower() in {".jpeg", ".jpg"} else image_path.suffix.lower()
        copied_name = f"NO_REAL_IMAGE_{idx:04d}_{digest[:10]}{ext}"
        copied_rel = Path("images") / copied_name
        shutil.copyfile(image_path, out_dir / copied_rel)
        doc_type = DOCUMENT_TYPE_LABEL_BY_FIELD.get(field_boxes[0]["field"], "medical_receipt")
        rows.append(
            {
                "dataset_id": f"NO_REAL_IMAGE_{idx:04d}",
                "claim_id": f"REAL-IMAGE-{idx:04d}",
                "document_type": doc_type,
                "label_family": "NO",
                "file_name": copied_rel.as_posix(),
                "source_url": "",
                "source_page_url": "",
                "source_collection_method": "user_supplied_real_image_folder_ocr_profiled",
                "source_original_path": str(image_path.as_posix()),
                "source_sha256": digest,
                "privacy_review_status": "pseudonymized_or_public_sample_requires_manual_review",
                "privacy_state": "pseudonymized_rewrite_ready",
                "raw_value_retention": False,
                "field_bboxes": field_boxes,
            }
        )

    manifest_path = out_dir / "manifest.real_image_stg.v1.jsonl"
    manifest_path.write_text("\n".join(json.dumps(row, ensure_ascii=False) for row in rows) + ("\n" if rows else ""), encoding="utf-8")
    profile_path = report_dir / "real_image_ocr_field_profiles.json"
    profile_path.write_text(json.dumps(profile_rows, ensure_ascii=False, indent=2), encoding="utf-8")
    summary = {
        "ok": bool(rows),
        "source_image_count": len(source_images),
        "manifest_row_count": len(rows),
        "field_candidate_count": field_candidate_count,
        "noise_rejected_token_count": noise_rejected,
        "manifest_path": str(manifest_path.as_posix()),
        "profile_path": str(profile_path.as_posix()),
        "copied_image_dir": str(copied_dir.as_posix()),
        "safety": "No mask/block/synthetic-only visual labels are generated; OCR raw values are not retained in manifest.",
    }
    (out_dir / "summary.real_image_stg.v1.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    return summary


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--image-dir", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--min-fields-per-image", type=int, default=2)
    args = parser.parse_args()
    summary = build_real_image_stg_manifest(args.image_dir, args.output_dir, min_fields_per_image=args.min_fields_per_image)
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0 if summary["ok"] else 2


if __name__ == "__main__":
    raise SystemExit(main())
