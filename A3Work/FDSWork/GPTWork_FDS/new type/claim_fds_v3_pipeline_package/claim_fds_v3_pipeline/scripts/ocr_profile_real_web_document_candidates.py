from __future__ import annotations

import argparse
import hashlib
import json
import re
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw
from rapidocr_onnxruntime import RapidOCR


FIELD_HINTS_KO: dict[str, list[str]] = {
    "총진료비": ["총진료비", "진료비총액", "진료비 총액", "합계"],
    "본인부담금": ["본인부담", "본인 부담", "환자부담", "환자 부담"],
    "비급여금액": ["비급여", "비 급여"],
    "청구금액": ["청구금액", "청구 금액", "보험금"],
    "진료일자": ["진료일", "진료 일자", "내원일", "통원일"],
    "발급일자": ["발급일", "발행일", "작성일"],
    "입원일자": ["입원일", "입원 일자"],
    "퇴원일자": ["퇴원일", "퇴원 일자"],
    "영수증번호": ["영수증", "영수번호", "문서번호", "접수번호"],
    "진단명": ["진단명", "상병명", "병명"],
    "질병분류기호": ["질병분류", "질병 분류", "상병코드", "분류기호"],
    "발급기관명": ["병원", "의원", "약국", "의료기관", "요양기관"],
    "처방정보": ["처방", "투약", "약품", "복약", "일수"],
}

SENSITIVE_PATTERNS = [
    (re.compile(r"\b\d{6}-?\d{7}\b"), "[비식별-주민번호후보]"),
    (re.compile(r"\b01[016789]-?\d{3,4}-?\d{4}\b"), "[비식별-전화번호후보]"),
    (re.compile(r"\b\d{2,3}-\d{2,4}-\d{4,6}\b"), "[비식별-번호후보]"),
    (re.compile(r"\b\d{4}[./-]\d{1,2}[./-]\d{1,2}\b"), "[날짜]"),
]


@dataclass
class OcrToken:
    token_id: str
    text_redacted: str
    text_sha256: str
    bbox_xyxy: list[int]
    confidence: float
    field_hint_ko: str


@dataclass
class OcrProfile:
    candidate_id: str
    document_type_label_ko: str
    source_image_path: str
    page_url: str
    image_url: str
    ocr_engine: str
    token_count: int
    mean_confidence: float
    field_hints_ko: list[str]
    ocr_json_path: str
    ocr_overlay_path: str
    privacy_note: str


def load_manifest(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def redact_text(text: str) -> str:
    out = text
    for pattern, repl in SENSITIVE_PATTERNS:
        out = pattern.sub(repl, out)
    return out


def text_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8", errors="ignore")).hexdigest()


def infer_field_hint(text: str) -> str:
    compact = re.sub(r"\s+", "", text)
    for label, terms in FIELD_HINTS_KO.items():
        if any(term.replace(" ", "") in compact for term in terms):
            return label
    if re.search(r"\d{1,3}(,\d{3})+|\d+원", text):
        return "금액후보"
    if re.search(r"\d{4}[./-]\d{1,2}[./-]\d{1,2}|\d{1,2}[./-]\d{1,2}", text):
        return "날짜후보"
    return "미분류필드"


def polygon_to_xyxy(poly: Any) -> list[int]:
    xs = [int(round(float(p[0]))) for p in poly]
    ys = [int(round(float(p[1]))) for p in poly]
    return [min(xs), min(ys), max(xs), max(ys)]


def draw_ocr_overlay(image_path: Path, tokens: list[OcrToken], out_path: Path) -> None:
    img = Image.open(image_path).convert("RGB")
    draw = ImageDraw.Draw(img)
    for idx, token in enumerate(tokens[:120], start=1):
        x1, y1, x2, y2 = token.bbox_xyxy
        color = (215, 40, 40) if token.field_hint_ko != "미분류필드" else (40, 110, 210)
        draw.rectangle((x1, y1, x2, y2), outline=color, width=2)
        # 이미지에는 영문 field key나 OCR 원문을 쓰지 않고 숫자 ID만 표시합니다.
        draw.text((x1, max(0, y1 - 12)), str(idx), fill=color)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    img.thumbnail((1400, 1400))
    img.save(out_path, quality=88)


def run_rapidocr(engine: RapidOCR, image_path: Path, store_raw_ocr: bool) -> list[OcrToken]:
    result, _ = engine(str(image_path))
    tokens: list[OcrToken] = []
    for idx, item in enumerate(result or [], start=1):
        if len(item) < 3:
            continue
        poly, text, conf = item[0], str(item[1]), float(item[2])
        redacted = text if store_raw_ocr else redact_text(text)
        tokens.append(
            OcrToken(
                token_id=f"T{idx:04d}",
                text_redacted=redacted,
                text_sha256=text_hash(text),
                bbox_xyxy=polygon_to_xyxy(poly),
                confidence=round(conf, 4),
                field_hint_ko=infer_field_hint(text),
            )
        )
    return tokens


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--collection-dir", required=True)
    ap.add_argument("--max-items", type=int, default=120)
    ap.add_argument("--store-raw-ocr", action="store_true", help="기본 비활성. 원문 OCR 저장은 PII 검수 전 권장하지 않음")
    args = ap.parse_args()

    collection_dir = Path(args.collection_dir)
    manifest_rows = load_manifest(collection_dir / "real_web_source_candidates.manifest.jsonl")
    out_dir = collection_dir / "ocr_profiles"
    json_dir = out_dir / "ocr_json"
    overlay_dir = out_dir / "ocr_overlays"
    out_dir.mkdir(parents=True, exist_ok=True)

    engine = RapidOCR()
    profiles: list[OcrProfile] = []
    processed_downloaded = 0
    for row in manifest_rows:
        local = row.get("local_path") or ""
        if not local:
            continue
        if processed_downloaded >= args.max_items:
            break
        path = Path(local)
        if not path.is_absolute():
            path = Path.cwd() / path
        if not path.exists():
            continue
        try:
            tokens = run_rapidocr(engine, path, args.store_raw_ocr)
            processed_downloaded += 1
        except Exception as exc:
            err_path = json_dir / f"{row.get('candidate_id')}.ocr_error.json"
            err_path.parent.mkdir(parents=True, exist_ok=True)
            err_path.write_text(json.dumps({"candidate_id": row.get("candidate_id"), "error": f"{type(exc).__name__}:{exc}"}, ensure_ascii=False, indent=2), encoding="utf-8")
            continue
        hints = sorted({t.field_hint_ko for t in tokens if t.field_hint_ko != "미분류필드"})
        token_payload = {
            "candidate_id": row.get("candidate_id"),
            "document_type_label_ko": row.get("document_type_label_ko") or row.get("document_type_guess"),
            "source_image_path": str(path.as_posix()),
            "page_url": row.get("page_url") or "",
            "image_url": row.get("image_url") or "",
            "ocr_engine": "rapidocr_onnxruntime_1.4.4",
            "store_raw_ocr": bool(args.store_raw_ocr),
            "privacy_note": "OCR text is redacted by default; raw text requires explicit --store-raw-ocr and manual PII review.",
            "tokens": [asdict(t) for t in tokens],
        }
        ocr_json = json_dir / f"{row.get('candidate_id')}.ocr.json"
        ocr_json.parent.mkdir(parents=True, exist_ok=True)
        ocr_json.write_text(json.dumps(token_payload, ensure_ascii=False, indent=2), encoding="utf-8")
        overlay = overlay_dir / f"{row.get('candidate_id')}.jpg"
        draw_ocr_overlay(path, tokens, overlay)
        profiles.append(
            OcrProfile(
                candidate_id=str(row.get("candidate_id")),
                document_type_label_ko=str(row.get("document_type_label_ko") or row.get("document_type_guess") or ""),
                source_image_path=str(path.as_posix()),
                page_url=str(row.get("page_url") or ""),
                image_url=str(row.get("image_url") or ""),
                ocr_engine="rapidocr_onnxruntime_1.4.4",
                token_count=len(tokens),
                mean_confidence=round(sum(t.confidence for t in tokens) / len(tokens), 4) if tokens else 0.0,
                field_hints_ko=hints,
                ocr_json_path=str(ocr_json.as_posix()),
                ocr_overlay_path=str(overlay.as_posix()),
                privacy_note="redacted_default" if not args.store_raw_ocr else "raw_ocr_stored_requires_manual_pii_review",
            )
        )

    profile_path = out_dir / "real_web_ocr_profiles.jsonl"
    profile_path.write_text("\n".join(json.dumps(asdict(p), ensure_ascii=False) for p in profiles) + ("\n" if profiles else ""), encoding="utf-8")
    summary = {
        "ok": True,
        "ocr_engine": "rapidocr_onnxruntime_1.4.4",
        "profile_count": len(profiles),
        "nonempty_ocr_count": sum(1 for p in profiles if p.token_count > 0),
        "field_hint_count": sum(1 for p in profiles if p.field_hints_ko),
        "profile_manifest": str(profile_path.as_posix()),
        "ocr_json_dir": str(json_dir.as_posix()),
        "ocr_overlay_dir": str(overlay_dir.as_posix()),
        "privacy_default": "raw OCR text is not stored unless --store-raw-ocr is passed",
    }
    (out_dir / "ocr_profile_summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
