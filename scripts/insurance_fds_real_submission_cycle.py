#!/usr/bin/env python
"""실제 외부 제출서류 PDF 기반 실손보험 FDS 수집/OCR-bbox/국소치환 사이클.

이 스크립트는 이전 실패 지점 두 가지를 바로잡기 위한 파이프라인이다.

1. Case 1 원본은 생성물이 아니라 실제 외부 웹 PDF/이미지여야 한다.
   - 보험사 보험금 청구서 양식은 기본 수집 대상에서 제외한다.
   - 진료비 계산서ㆍ영수증, 진료비 세부산정내역서, 약제비 계산서ㆍ영수증, 처방전 계열을 우선한다.

2. 국소치환 위치는 임의 비율 박스가 아니라 실제 PDF 텍스트/라벨 좌표에서 유도한다.
   - PyMuPDF의 word bbox를 사용해 라벨 후보를 찾는다.
   - 라벨 오른쪽 또는 같은 행의 blank/value 영역을 target bbox로 만든다.
   - NO derivative에는 가명 값을 채우고, AF derivative는 같은 bbox 안에서만 값을 바꾼다.
   - NO와 AF 사이의 pixel diff가 target bbox 밖으로 새면 검증 실패로 기록한다.

주의: 이 스크립트는 방어적 FDS 학습/검수용 데이터 엔지니어링 도구다. 실제 개인정보 문서를 원본으로 승격하지 않으며,
공개 양식/공식 서식/샘플 문서만 사용한다. 이미지 픽셀 안에는 AF, 합성, 제출불가 같은 shortcut label을 넣지 않는다.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import re
import urllib.error
import urllib.request
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable
from urllib.parse import unquote, urlparse

try:
    import fitz  # type: ignore
except Exception:  # pragma: no cover - tested in uv runtime
    fitz = None  # type: ignore

try:
    from PIL import Image, ImageChops, ImageDraw, ImageFont, PngImagePlugin
except Exception:  # pragma: no cover - tested in uv runtime
    Image = ImageChops = ImageDraw = ImageFont = PngImagePlugin = None  # type: ignore

VERSION = "insurance-fds-real-submission-cycle-v0.3"
TARGET_DOCUMENT_TYPES = {
    "medical_receipt": "진료비 계산서ㆍ영수증",
    "medical_detail_statement": "진료비 세부산정내역서",
    "pharmacy_receipt": "약제비 계산서ㆍ영수증",
    "prescription": "처방전",
}
INSURER_FORM_NEGATIVE_KEYWORDS = ("보험금청구서", "보험금 청구서", "보험회사", "피보험자", "보험수익자")
SUBMISSION_POSITIVE_KEYWORDS = (
    "진료비",
    "계산서",
    "영수증",
    "세부산정내역",
    "약제비",
    "처방전",
    "환자 성명",
    "조제일",
    "본인부담",
    "비급여",
)


@dataclass(frozen=True)
class SourceSeed:
    source_id: str
    title: str
    url: str
    document_type: str
    authority: str
    source_note: str


@dataclass(frozen=True)
class FieldTarget:
    field_key: str
    label_ko: str
    value_type: str
    source_page_index: int
    label_bbox_pdf: tuple[float, float, float, float]
    value_bbox_pdf: tuple[float, float, float, float]
    label_bbox_px: tuple[int, int, int, int]
    value_bbox_px: tuple[int, int, int, int]
    before_value: str
    no_value: str
    af_value: str
    fds_reason: str
    extraction_method: str


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_file(path: Path) -> str:
    return sha256_bytes(path.read_bytes())


def safe_name(text: str, max_len: int = 90) -> str:
    text = re.sub(r"[\\/:*?\"<>|\r\n\t]+", "_", text)
    text = re.sub(r"\s+", "_", text).strip(" ._")
    return text[:max_len] or "문서"


def default_source_seeds() -> list[SourceSeed]:
    """웹 검색으로 확인한 실제 외부 제출서류/공식 서식 PDF 후보를 반환한다."""

    return [
        SourceSeed(
            "REAL-SUB-0001",
            "법령정보센터 약제비 계산서ㆍ영수증 별지 서식",
            "https://www.law.go.kr/LSW/flDownload.do?gubun=&flSeq=150343257&bylClsCd=110202",
            "pharmacy_receipt",
            "official_statutory_form",
            "검색 결과: 약제비 계산서ㆍ영수증 PDF. 실손 청구 시 약국 제출서류의 공식 blank form.",
        ),
        SourceSeed(
            "REAL-SUB-0002",
            "법령정보센터 간이 외래 진료비 계산서ㆍ영수증 별지 서식",
            "https://www.law.go.kr/LSW//flDownload.do?gubun=&flSeq=163452923&bylClsCd=110202",
            "medical_receipt",
            "official_statutory_form",
            "검색 결과: 진료비 계산서ㆍ영수증 PDF. 병원비 영수증 공식 blank form.",
        ),
        SourceSeed(
            "REAL-SUB-0003",
            "라이나생명 공개 진료비 세부산정내역 서식 PDF",
            "https://m.lina.co.kr/upload/docs/claim/exam/medical_expense_detail.pdf",
            "medical_detail_statement",
            "quasi_official_public_form",
            "검색 결과: 진료비 세부산정내역 서식. 보험사 도메인이지만 보험금 청구서가 아니라 병원 제출 증빙 서식.",
        ),
        SourceSeed(
            "REAL-SUB-0004",
            "남동구 보건소 공개 외래/입원 진료비 계산서ㆍ영수증 PDF",
            "https://biz.namdong.go.kr/clinic/bbs/bbsMsgFileDown.do?bcd=civil_counsel&msg_seq=1600&fileno=1",
            "medical_receipt",
            "public_institution_sample_or_form",
            "검색 결과: 진료비 계산서ㆍ영수증 PDF. 기관 공개 파일.",
        ),
        SourceSeed(
            "REAL-SUB-0005",
            "공개 약제비계산서/영수증 샘플 PDF",
            "https://imet.kr/download/Pharmacy_receipts.pdf",
            "pharmacy_receipt",
            "public_sample_form",
            "검색 결과: 약제비계산서/영수증 샘플. 실제 약국 제출서류 형태 확인용.",
        ),
    ]


def is_submission_evidence_seed(seed: SourceSeed) -> bool:
    """보험사 청구서 양식이 아닌 병원/약국 제출 증빙서류 seed인지 판정한다."""

    title_compact = re.sub(r"\s+", "", seed.title)
    if seed.document_type not in TARGET_DOCUMENT_TYPES:
        return False
    if any(keyword in title_compact for keyword in INSURER_FORM_NEGATIVE_KEYWORDS):
        return False
    positive_blob = seed.title + " " + seed.source_note + " " + TARGET_DOCUMENT_TYPES.get(seed.document_type, "")
    return any(keyword in positive_blob for keyword in SUBMISSION_POSITIVE_KEYWORDS)


def filtered_source_seeds(seeds: Iterable[SourceSeed] | None = None) -> list[SourceSeed]:
    return [seed for seed in (list(seeds) if seeds is not None else default_source_seeds()) if is_submission_evidence_seed(seed)]


def download_url(url: str, timeout: int = 60) -> tuple[bytes, str, str]:
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 insurance-fds-real-submission-cycle/0.3",
            "Accept": "application/pdf,image/*,*/*;q=0.8",
        },
    )
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return response.read(), response.headers.get("Content-Type", "application/octet-stream"), response.geturl()


def infer_extension(url: str, content_type: str) -> str:
    suffix = Path(unquote(urlparse(url).path)).suffix.lower()
    if suffix in {".pdf", ".png", ".jpg", ".jpeg", ".webp", ".tif", ".tiff"}:
        return suffix
    ctype = content_type.split(";")[0].strip().lower()
    if ctype == "application/pdf" or not suffix:
        return ".pdf"
    if ctype == "image/png":
        return ".png"
    if ctype in {"image/jpeg", "image/jpg"}:
        return ".jpg"
    return ".pdf"


def render_pdf_page(pdf_path: Path, page_index: int, output_path: Path, zoom: float = 2.0) -> dict[str, Any]:
    if fitz is None:
        raise RuntimeError("PyMuPDF(fitz) is required. Run with uv --with pymupdf.")
    doc = fitz.open(str(pdf_path))
    page = doc.load_page(page_index)
    pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), alpha=False)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    pix.save(str(output_path))
    rect = page.rect
    meta = {"page_width_pdf": rect.width, "page_height_pdf": rect.height, "zoom": zoom, "image_width": pix.width, "image_height": pix.height}
    doc.close()
    return meta


def get_pdf_words(pdf_path: Path, page_index: int) -> list[tuple[float, float, float, float, str, int, int, int]]:
    if fitz is None:
        raise RuntimeError("PyMuPDF(fitz) is required. Run with uv --with pymupdf.")
    doc = fitz.open(str(pdf_path))
    page = doc.load_page(page_index)
    words = page.get_text("words")
    doc.close()
    return words


def line_groups(words: list[tuple[float, float, float, float, str, int, int, int]]) -> list[list[tuple[float, float, float, float, str, int, int, int]]]:
    rows: dict[tuple[int, int], list[tuple[float, float, float, float, str, int, int, int]]] = {}
    for word in words:
        block, line = int(word[5]), int(word[6])
        rows.setdefault((block, line), []).append(word)
    grouped = []
    for row in rows.values():
        grouped.append(sorted(row, key=lambda w: (w[0], w[1])))
    return sorted(grouped, key=lambda row: (min(w[1] for w in row), min(w[0] for w in row)))


def bbox_union(words: list[tuple[float, float, float, float, str, int, int, int]]) -> tuple[float, float, float, float]:
    return min(w[0] for w in words), min(w[1] for w in words), max(w[2] for w in words), max(w[3] for w in words)


def normalize_text(text: str) -> str:
    return re.sub(r"[\sㆍ·:\[\]()]+", "", text)


def field_specs_for_document(document_type: str) -> list[dict[str, str]]:
    common = [
        {"field_key": "patient_name", "label_ko": "환자 성명", "value_type": "person_name", "no_value": "가명김서연", "af_value": "가명박민준", "reason": "동일 bundle 내 환자명 불일치"},
    ]
    if document_type == "pharmacy_receipt":
        return common + [
            {"field_key": "dispense_date", "label_ko": "조제일", "value_type": "date", "no_value": "2026-05-13", "af_value": "2026-05-28", "reason": "처방전 발행일보다 조제일이 비정상적으로 뒤로 이동"},
            {"field_key": "pharmacy_total_amount", "label_ko": "약제비", "value_type": "amount", "no_value": "22,400", "af_value": "122,400", "reason": "약제비 합계가 처방/조제 항목 합계와 충돌"},
            {"field_key": "receipt_no", "label_ko": "영수증번호", "value_type": "receipt_no", "no_value": "RX-260513-0217", "af_value": "RX-260528-9911", "reason": "영수증번호가 처방전번호/조제일자와 불일치"},
        ]
    if document_type == "medical_detail_statement":
        return common + [
            {"field_key": "visit_date", "label_ko": "진료일", "value_type": "date", "no_value": "2026-05-13", "af_value": "2026-05-18", "reason": "영수증 진료일자와 세부내역 진료일자 불일치"},
            {"field_key": "noncovered_amount", "label_ko": "비급여", "value_type": "amount", "no_value": "129,000", "af_value": "329,000", "reason": "비급여 항목이 총액/영수증과 충돌"},
            {"field_key": "detail_total_amount", "label_ko": "합계", "value_type": "amount", "no_value": "187,500", "af_value": "387,500", "reason": "세부내역 합계가 진료비 영수증 총액과 불일치"},
        ]
    if document_type == "prescription":
        return common + [
            {"field_key": "prescription_date", "label_ko": "교부", "value_type": "date", "no_value": "2026-05-13", "af_value": "2026-05-29", "reason": "처방전 교부일과 약제비 조제일 순서 충돌"},
            {"field_key": "prescription_no", "label_ko": "교부번호", "value_type": "receipt_no", "no_value": "RX-260513-0217", "af_value": "RX-260529-7781", "reason": "처방전번호가 약제비 영수증 처방전번호와 불일치"},
        ]
    return common + [
        {"field_key": "visit_date", "label_ko": "진료", "value_type": "date", "no_value": "2026-05-13", "af_value": "2026-05-18", "reason": "세부내역서/통원확인서 진료일자와 불일치"},
        {"field_key": "total_medical_amount", "label_ko": "진료비 총액", "value_type": "amount", "no_value": "187,500", "af_value": "287,500", "reason": "급여+비급여 합산액과 총진료비가 충돌"},
        {"field_key": "patient_pay_amount", "label_ko": "본인부담", "value_type": "amount", "no_value": "58,500", "af_value": "158,500", "reason": "본인부담/청구가능금액 산식과 충돌"},
    ]


def find_label_line(words: list[tuple[float, float, float, float, str, int, int, int]], label: str) -> list[tuple[float, float, float, float, str, int, int, int]] | None:
    want = normalize_text(label)
    aliases = {want}
    if "환자성명" in want:
        aliases.update({"환자", "수진자", "성명"})
    if "조제일" in want:
        aliases.update({"조제일자", "조제"})
    if "진료비총액" in want:
        aliases.update({"진료비총액", "총액", "합계"})
    if "본인부담" in want:
        aliases.update({"본인부담", "일부본인부담"})
    if "영수증번호" in want:
        aliases.update({"영수증번호", "영수품번호"})
    if "진료일" in want:
        aliases.update({"진료일", "진료일자", "진료기간"})
    if "비급여" in want:
        aliases.add("비급여")
    if "합계" in want:
        aliases.add("합계")
    if "교부" in want:
        aliases.update({"교부", "교부번호", "교부연월일"})

    best: tuple[int, list[tuple[float, float, float, float, str, int, int, int]]] | None = None
    for row in line_groups(words):
        text = normalize_text("".join(w[4] for w in row))
        hits = sum(1 for alias in aliases if alias and alias in text)
        if hits and (best is None or hits > best[0]):
            best = (hits, row)
    return best[1] if best else None


def infer_value_bbox_from_label_line(
    row: list[tuple[float, float, float, float, str, int, int, int]], page_width: float, page_height: float
) -> tuple[tuple[float, float, float, float], str]:
    x1, y1, x2, y2 = bbox_union(row)
    row_text = " ".join(w[4] for w in row)
    # 같은 행 오른쪽에 값이 있으면 우선 사용하고, blank form이면 라벨 오른쪽의 빈 영역을 target으로 삼는다.
    right_words = [w for w in row if w[0] > x2 + 4]
    if right_words:
        return bbox_union(right_words), row_text
    h = max(12.0, y2 - y1)
    target_x1 = min(page_width - 90, x2 + 8)
    target_x2 = min(page_width - 24, target_x1 + max(90, min(180, page_width * 0.25)))
    target_y1 = max(0.0, y1 - h * 0.15)
    target_y2 = min(page_height, y2 + h * 0.25)
    if target_x2 <= target_x1 + 20:
        target_x1 = max(24.0, x1 + 80)
        target_x2 = min(page_width - 24, target_x1 + 130)
    return (target_x1, target_y1, target_x2, target_y2), ""


def pdf_bbox_to_pixel_bbox(bbox: tuple[float, float, float, float], zoom: float, image_size: tuple[int, int], pad: int = 2) -> tuple[int, int, int, int]:
    width, height = image_size
    x1, y1, x2, y2 = bbox
    return (
        max(0, int(math.floor(x1 * zoom)) - pad),
        max(0, int(math.floor(y1 * zoom)) - pad),
        min(width, int(math.ceil(x2 * zoom)) + pad),
        min(height, int(math.ceil(y2 * zoom)) + pad),
    )


def extract_field_targets(pdf_path: Path, document_type: str, preview_meta: dict[str, Any]) -> list[FieldTarget]:
    if fitz is None:
        raise RuntimeError("PyMuPDF(fitz) is required. Run with uv --with pymupdf.")
    doc = fitz.open(str(pdf_path))
    page_index = 0
    # 첫 두 페이지 중 target label이 더 많이 잡히는 페이지를 선택한다. 표지/공문 페이지를 피하기 위한 간단한 게이트다.
    best_words: list[tuple[float, float, float, float, str, int, int, int]] = []
    best_hits = -1
    for idx in range(min(2, doc.page_count)):
        words = doc.load_page(idx).get_text("words")
        text = " ".join(w[4] for w in words)
        hits = sum(1 for spec in field_specs_for_document(document_type) if normalize_text(spec["label_ko"]) in normalize_text(text))
        hits += sum(1 for kw in SUBMISSION_POSITIVE_KEYWORDS if kw in text)
        if hits > best_hits:
            best_hits = hits
            best_words = words
            page_index = idx
    page = doc.load_page(page_index)
    page_rect = page.rect
    doc.close()

    image_size = (int(preview_meta["image_width"]), int(preview_meta["image_height"]))
    zoom = float(preview_meta["zoom"])
    targets: list[FieldTarget] = []
    for spec in field_specs_for_document(document_type):
        row = find_label_line(best_words, spec["label_ko"])
        if not row:
            continue
        label_bbox = bbox_union(row)
        value_bbox, before = infer_value_bbox_from_label_line(row, page_rect.width, page_rect.height)
        label_px = pdf_bbox_to_pixel_bbox(label_bbox, zoom, image_size, pad=2)
        value_px = pdf_bbox_to_pixel_bbox(value_bbox, zoom, image_size, pad=3)
        if value_px[2] - value_px[0] < 18 or value_px[3] - value_px[1] < 8:
            continue
        targets.append(
            FieldTarget(
                field_key=spec["field_key"],
                label_ko=spec["label_ko"],
                value_type=spec["value_type"],
                source_page_index=page_index,
                label_bbox_pdf=tuple(float(v) for v in label_bbox),
                value_bbox_pdf=tuple(float(v) for v in value_bbox),
                label_bbox_px=label_px,
                value_bbox_px=value_px,
                before_value=before,
                no_value=spec["no_value"],
                af_value=spec["af_value"],
                fds_reason=spec["reason"],
                extraction_method="pymupdf_word_bbox_label_to_right_value_box",
            )
        )
    return targets


def _group_positions(positions: list[int], max_gap: int = 2) -> list[int]:
    if not positions:
        return []
    groups: list[list[int]] = [[positions[0]]]
    for pos in positions[1:]:
        if pos - groups[-1][-1] <= max_gap:
            groups[-1].append(pos)
        else:
            groups.append([pos])
    return [int(sum(group) / len(group)) for group in groups]


def detect_table_cells_from_image(image_path: Path) -> list[tuple[int, int, int, int]]:
    """텍스트 레이어가 없는 스캔/이미지 PDF에서 표 선 기반 실제 셀 bbox를 찾는다.

    OCR이 없을 때의 fallback이다. 임의 비율 박스가 아니라 렌더링된 실제 문서 픽셀의 긴 가로/세로 선을
    감지해 셀 후보를 만든다. 이 후보는 OCR label-value보다는 약하지만, 실제 문서 구조 좌표라는 점이 핵심이다.
    """

    ensure_pillow()
    img = Image.open(image_path).convert("L")
    width, height = img.size
    px = img.load()
    dark = 160
    horizontal = []
    for y in range(height):
        cnt = sum(1 for x in range(width) if px[x, y] < dark)
        if cnt > max(width * 0.045, 45):
            horizontal.append(y)
    vertical = []
    for x in range(width):
        cnt = sum(1 for y in range(height) if px[x, y] < dark)
        if cnt > max(height * 0.030, 45):
            vertical.append(x)
    ys = _group_positions(horizontal, max_gap=4)
    xs = _group_positions(vertical, max_gap=4)
    cells: list[tuple[int, int, int, int]] = []
    for y1, y2 in zip(ys, ys[1:]):
        if not (10 <= y2 - y1 <= height * 0.28):
            continue
        for x1, x2 in zip(xs, xs[1:]):
            if not (35 <= x2 - x1 <= width * 0.70):
                continue
            cells.append((x1 + 3, y1 + 3, x2 - 3, y2 - 3))
    return sorted(cells, key=lambda b: (b[1], b[0], b[2] - b[0]))


def detect_text_band_boxes_from_image(image_path: Path) -> list[tuple[int, int, int, int]]:
    """표 선이 약한 스캔본에서 실제 어두운 글자 band를 bbox 후보로 잡는다.

    이 fallback은 OCR 엔진 없이도 실제 문서 픽셀에서 나온 좌표만 사용한다. 행별 dark-pixel band를 찾고,
    각 band 안의 dark-pixel x 범위를 target bbox로 만든다. 따라서 좌표는 임의 비율이 아니라 원본 이미지의
    실제 텍스트/금액/날짜 위치에서 유도된다.
    """

    ensure_pillow()
    img = Image.open(image_path).convert("L")
    width, height = img.size
    px = img.load()
    dark = 155
    row_hits: list[int] = []
    for y in range(height):
        cnt = sum(1 for x in range(width) if px[x, y] < dark)
        if 8 <= cnt <= width * 0.55:
            row_hits.append(y)
    if not row_hits:
        return []
    row_groups: list[list[int]] = [[row_hits[0]]]
    for y in row_hits[1:]:
        if y - row_groups[-1][-1] <= 6:
            row_groups[-1].append(y)
        else:
            row_groups.append([y])
    boxes: list[tuple[int, int, int, int]] = []
    for group in row_groups:
        if not (5 <= len(group) <= 80):
            continue
        y1, y2 = max(0, group[0] - 3), min(height, group[-1] + 4)
        xs = [x for x in range(width) if sum(1 for y in range(y1, y2) if px[x, y] < dark) >= 2]
        if not xs:
            continue
        x1, x2 = max(0, min(xs) - 3), min(width, max(xs) + 4)
        if 28 <= x2 - x1 <= width * 0.72 and 8 <= y2 - y1 <= 90:
            boxes.append((x1, y1, x2, y2))
    # 문서 주변 잡음과 본문 긴 문단은 제외하고, 상단/중단의 짧은 필드형 band를 우선한다.
    filtered = [b for b in boxes if height * 0.03 <= b[1] <= height * 0.85]
    filtered.sort(key=lambda b: (b[1], b[0]))
    return filtered


def extract_table_fallback_targets(preview_path: Path, document_type: str, preview_meta: dict[str, Any]) -> list[FieldTarget]:
    cells = detect_table_cells_from_image(preview_path)
    width, height = int(preview_meta["image_width"]), int(preview_meta["image_height"])
    # 너무 작은 설명문 셀/테두리를 제외하고, 상단 식별 영역과 중하단 금액 영역을 섞어 선택한다.
    usable = [b for b in cells if (b[2] - b[0]) >= 70 and (b[3] - b[1]) >= 12 and b[1] < height * 0.82]
    if not usable:
        usable = [b for b in detect_text_band_boxes_from_image(preview_path) if b[1] < height * 0.82]
    if not usable:
        return []
    top = [b for b in usable if height * 0.08 <= b[1] <= height * 0.32]
    mid = [b for b in usable if height * 0.32 < b[1] <= height * 0.70]
    lower = [b for b in usable if height * 0.70 < b[1] <= height * 0.82]
    selected: list[tuple[int, int, int, int]] = []
    for pool in [top, mid, lower, usable]:
        for box in pool:
            if box not in selected:
                selected.append(box)
            if len(selected) >= 3:
                break
        if len(selected) >= 3:
            break
    targets: list[FieldTarget] = []
    specs = field_specs_for_document(document_type)
    zoom = float(preview_meta["zoom"])
    for idx, (spec, value_px) in enumerate(zip(specs, selected), start=1):
        label_px = (max(0, value_px[0] - 80), value_px[1], value_px[0], value_px[3])
        value_pdf = tuple(float(v / zoom) for v in value_px)
        label_pdf = tuple(float(v / zoom) for v in label_px)
        targets.append(
            FieldTarget(
                field_key=spec["field_key"],
                label_ko=spec["label_ko"],
                value_type=spec["value_type"],
                source_page_index=0,
                label_bbox_pdf=label_pdf,
                value_bbox_pdf=value_pdf,
                label_bbox_px=label_px,
                value_bbox_px=value_px,
                before_value="",
                no_value=spec["no_value"],
                af_value=spec["af_value"],
                fds_reason=spec["reason"],
                extraction_method="image_table_line_bbox_fallback_no_text_layer",
            )
        )
    return targets


def ensure_pillow() -> None:
    if Image is None or ImageDraw is None or ImageFont is None:
        raise RuntimeError("Pillow is required. Run with uv --with pillow.")


def load_font(size: int) -> Any:
    ensure_pillow()
    for candidate in ["C:/Windows/Fonts/malgun.ttf", "C:/Windows/Fonts/gulim.ttc", "C:/Windows/Fonts/arial.ttf"]:
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size=size)
    return ImageFont.load_default()


def fit_font_for_box(text: str, bbox: tuple[int, int, int, int]) -> Any:
    ensure_pillow()
    x1, y1, x2, y2 = bbox
    max_w = max(4, x2 - x1 - 4)
    max_h = max(4, y2 - y1 - 4)
    for size in range(max(8, min(24, max_h)), 6, -1):
        font = load_font(size)
        probe = Image.new("RGB", (10, 10))
        draw = ImageDraw.Draw(probe)
        tb = draw.textbbox((0, 0), text, font=font)
        if tb[2] - tb[0] <= max_w and tb[3] - tb[1] <= max_h:
            return font
    return load_font(7)


def sample_bg(image: Any, bbox: tuple[int, int, int, int]) -> tuple[int, int, int]:
    rgb = image.convert("RGB")
    px = rgb.load()
    width, height = rgb.size
    x1, y1, x2, y2 = bbox
    samples: list[tuple[int, int, int]] = []
    for y in range(max(0, y1 - 4), min(height, y2 + 4)):
        for x in range(max(0, x1 - 4), min(width, x2 + 4)):
            if x1 <= x < x2 and y1 <= y < y2:
                continue
            r, g, b = px[x, y]
            if (r + g + b) / 3 > 180:
                samples.append((r, g, b))
    if not samples:
        return (255, 255, 255)
    samples = samples[:2000]
    return tuple(sorted(channel)[len(channel) // 2] for channel in zip(*samples))  # type: ignore[return-value]


def draw_value_inside_bbox(image_path: Path, output_path: Path, bbox: tuple[int, int, int, int], value: str, metadata: dict[str, Any]) -> None:
    ensure_pillow()
    img = Image.open(image_path).convert("RGB")
    x1, y1, x2, y2 = bbox
    box_w, box_h = max(1, x2 - x1), max(1, y2 - y1)
    bg = sample_bg(img, bbox)

    # 중요: 원본 전체에 직접 text를 그리면 anti-aliasing 또는 glyph bearing 때문에 bbox 밖 픽셀이 바뀔 수 있다.
    # 따라서 bbox 크기의 crop canvas 안에서만 지우고/렌더링한 뒤 같은 bbox에 paste하여 outside-target diff를 0으로 강제한다.
    patch_img = Image.new("RGB", (box_w, box_h), bg)
    patch_draw = ImageDraw.Draw(patch_img)
    font = fit_font_for_box(value, (0, 0, box_w, box_h))
    tb = patch_draw.textbbox((0, 0), value, font=font)
    tx = 2
    ty = max(1, (box_h - (tb[3] - tb[1])) // 2 - 1)
    patch_draw.text((tx, ty), value, fill=(20, 20, 20), font=font)
    img.paste(patch_img, (x1, y1, x2, y2))

    output_path.parent.mkdir(parents=True, exist_ok=True)
    info = PngImagePlugin.PngInfo()
    for key, raw in metadata.items():
        info.add_text(str(key), json.dumps(raw, ensure_ascii=False, sort_keys=True) if isinstance(raw, (dict, list)) else str(raw))
    img.save(output_path, pnginfo=info)


def outside_bbox_diff_count(before_path: Path, after_path: Path, bbox: tuple[int, int, int, int]) -> int:
    ensure_pillow()
    before = Image.open(before_path).convert("RGB")
    after = Image.open(after_path).convert("RGB")
    diff = ImageChops.difference(before, after)
    px = diff.load()
    width, height = diff.size
    x1, y1, x2, y2 = bbox
    count = 0
    for y in range(height):
        for x in range(width):
            if x1 <= x < x2 and y1 <= y < y2:
                continue
            if px[x, y] != (0, 0, 0):
                count += 1
    return count


def make_contact_sheet(image_records: list[dict[str, Any]], output_path: Path, thumb_width: int = 360) -> None:
    ensure_pillow()
    thumbs = []
    label_font = load_font(16)
    for rec in image_records:
        img = Image.open(rec["image_path"]).convert("RGB")
        ratio = thumb_width / img.width
        thumb = img.resize((thumb_width, int(img.height * ratio)))
        canvas = Image.new("RGB", (thumb_width, thumb.height + 58), (245, 245, 245))
        canvas.paste(thumb, (0, 0))
        draw = ImageDraw.Draw(canvas)
        draw.text((6, thumb.height + 6), rec.get("caption", "")[:42], fill=(20, 20, 20), font=label_font)
        draw.text((6, thumb.height + 30), rec.get("document_type_ko", ""), fill=(70, 70, 70), font=label_font)
        thumbs.append(canvas)
    if not thumbs:
        return
    cols = 3
    rows = math.ceil(len(thumbs) / cols)
    cell_w = max(t.width for t in thumbs)
    cell_h = max(t.height for t in thumbs)
    sheet = Image.new("RGB", (cols * cell_w, rows * cell_h), (230, 230, 230))
    for i, thumb in enumerate(thumbs):
        sheet.paste(thumb, ((i % cols) * cell_w, (i // cols) * cell_h))
    output_path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output_path)


def collect_and_generate(output_root: Path, limit: int | None = None) -> dict[str, Any]:
    if fitz is None:
        raise RuntimeError("PyMuPDF(fitz) is required. Run with uv --with pymupdf.")
    ensure_pillow()
    output_root.mkdir(parents=True, exist_ok=True)
    raw_dir = output_root / "case1_real_external_sources" / "raw"
    preview_dir = output_root / "case1_real_external_sources" / "preview_pages"
    no_dir = output_root / "case1_filled_no_derivatives"
    af_dir = output_root / "case3_same_bbox_local_substitution_af"
    evidence_dir = output_root / "evidence"
    index_dir = output_root / "indexes"
    for d in [raw_dir, preview_dir, no_dir, af_dir, evidence_dir, index_dir]:
        d.mkdir(parents=True, exist_ok=True)

    seeds = filtered_source_seeds()
    if limit is not None:
        seeds = seeds[:limit]
    source_records: list[dict[str, Any]] = []
    failures: list[dict[str, Any]] = []
    field_records: list[dict[str, Any]] = []
    pair_records: list[dict[str, Any]] = []
    contact_images: list[dict[str, Any]] = []

    for seed in seeds:
        try:
            ext = ".pdf"
            cached = sorted(raw_dir.glob(f"{seed.source_id}__*.pdf"))
            try:
                data, ctype, final_url = download_url(seed.url)
            except (OSError, urllib.error.URLError, TimeoutError) as download_exc:
                if not cached:
                    raise download_exc
                raw_path = cached[0]
                data = raw_path.read_bytes()
                ctype = "application/pdf; cached_after_download_failure"
                final_url = seed.url
                ext = raw_path.suffix.lower()
            else:
                ext = infer_extension(final_url, ctype)
                raw_path = raw_dir / f"{seed.source_id}__{safe_name(seed.title)}{ext}"
                raw_path.write_bytes(data)
            raw_sha = sha256_file(raw_path)
            if ext != ".pdf":
                raise ValueError(f"현재 v0.3은 PDF bbox 추출만 승격한다: {ext}")
            doc = fitz.open(str(raw_path))
            page_count = doc.page_count
            doc.close()
            preview_path = preview_dir / f"{seed.source_id}__page1.png"
            preview_meta = render_pdf_page(raw_path, 0, preview_path, zoom=2.0)
            targets = extract_field_targets(raw_path, seed.document_type, preview_meta)
            if not targets:
                targets = extract_table_fallback_targets(preview_path, seed.document_type, preview_meta)
            source_record = {
                "source_id": seed.source_id,
                "title": seed.title,
                "url": seed.url,
                "final_url": final_url,
                "authority": seed.authority,
                "document_type": seed.document_type,
                "document_type_ko": TARGET_DOCUMENT_TYPES[seed.document_type],
                "source_note": seed.source_note,
                "local_path": str(raw_path),
                "sha256": raw_sha,
                "content_type": ctype,
                "page_count": page_count,
                "generated_or_synthetic": False,
                "actual_document_origin": "external_web_or_file",
                "insurer_claim_form_excluded": True,
                "preview_image_path": str(preview_path),
                "preview_sha256": sha256_file(preview_path),
                "field_target_count": len(targets),
            }
            source_records.append(source_record)
            contact_images.append({"image_path": str(preview_path), "caption": f"Case1 원본 {seed.source_id}", "document_type_ko": TARGET_DOCUMENT_TYPES[seed.document_type]})
            for idx, target in enumerate(targets[:3], start=1):
                fid = f"{seed.source_id}-FIELD-{idx:02d}"
                field_record = {
                    "field_id": fid,
                    "source_id": seed.source_id,
                    "document_type": seed.document_type,
                    "document_type_ko": TARGET_DOCUMENT_TYPES[seed.document_type],
                    "field_key": target.field_key,
                    "label_ko": target.label_ko,
                    "value_type": target.value_type,
                    "source_page_index": target.source_page_index,
                    "label_bbox_pdf": list(target.label_bbox_pdf),
                    "value_bbox_pdf": list(target.value_bbox_pdf),
                    "label_bbox_px": list(target.label_bbox_px),
                    "value_bbox_px": list(target.value_bbox_px),
                    "before_ocr_or_pdf_text": target.before_value,
                    "no_value": target.no_value,
                    "af_value": target.af_value,
                    "fds_reason": target.fds_reason,
                    "extraction_method": target.extraction_method,
                }
                field_records.append(field_record)
                no_path = no_dir / f"{fid}__NO_filled.png"
                af_path = af_dir / f"{fid}__AF_same_bbox.png"
                draw_value_inside_bbox(
                    preview_path,
                    no_path,
                    target.value_bbox_px,
                    target.no_value,
                    {"dataset_version": VERSION, "role": "NO_filled_derivative", "field_record": field_record},
                )
                draw_value_inside_bbox(
                    no_path,
                    af_path,
                    target.value_bbox_px,
                    target.af_value,
                    {"dataset_version": VERSION, "role": "AF_same_bbox_local_substitution", "field_record": field_record},
                )
                outside = outside_bbox_diff_count(no_path, af_path, target.value_bbox_px)
                pair = {
                    "pair_id": fid,
                    "source_id": seed.source_id,
                    "document_type": seed.document_type,
                    "document_type_ko": TARGET_DOCUMENT_TYPES[seed.document_type],
                    "no_image_path": str(no_path),
                    "af_image_path": str(af_path),
                    "no_sha256": sha256_file(no_path),
                    "af_sha256": sha256_file(af_path),
                    "changed_field": field_record,
                    "same_coordinate_policy": "AF uses exact Case1/NO value_bbox_px",
                    "outside_target_changed_pixels": outside,
                    "bbox_ok": outside == 0,
                    "visible_shortcut_label_inside_image": False,
                }
                pair_records.append(pair)
                (evidence_dir / f"{fid}.json").write_text(json.dumps(pair, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
                contact_images.append({"image_path": str(no_path), "caption": f"NO 채움 {fid}", "document_type_ko": target.label_ko})
                contact_images.append({"image_path": str(af_path), "caption": f"AF 동일좌표 {fid}", "document_type_ko": target.label_ko})
        except (OSError, urllib.error.URLError, TimeoutError, ValueError, RuntimeError) as exc:
            failures.append({"source_id": seed.source_id, "title": seed.title, "url": seed.url, "error": str(exc)})

    contact_sheet = index_dir / "real_submission_bbox_local_substitution_contact_sheet.png"
    make_contact_sheet(contact_images[:18], contact_sheet)
    manifest = {
        "artifact": VERSION,
        "created_at": now_iso(),
        "definition": "Actual external hospital/pharmacy submission-form PDFs -> PDF text bbox field targets -> filled NO derivatives -> same-bbox AF local substitutions.",
        "safety_policy": {
            "real_personal_data_allowed": False,
            "source_rule": "public official/quasi-official blank forms or public samples only",
            "image_shortcut_labels_allowed": False,
            "insurer_claim_forms_default_excluded": True,
        },
        "source_count": len(source_records),
        "failure_count": len(failures),
        "field_target_count": len(field_records),
        "pair_count": len(pair_records),
        "source_records": source_records,
        "field_records": field_records,
        "pair_records": pair_records,
        "failures": failures,
        "contact_sheet_path": str(contact_sheet),
    }
    manifest["validation"] = validate_manifest(manifest)
    (output_root / "manifests").mkdir(parents=True, exist_ok=True)
    manifest_path = output_root / "manifests" / "real_submission_bbox_local_substitution_manifest.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    index_md = build_index_md(manifest, manifest_path)
    (index_dir / "real_submission_bbox_local_substitution_index.ko.md").write_text(index_md, encoding="utf-8")
    return manifest


def validate_manifest(manifest: dict[str, Any]) -> dict[str, Any]:
    sources = manifest.get("source_records", [])
    pairs = manifest.get("pair_records", [])
    failures = manifest.get("failures", [])
    missing_paths: list[str] = []
    for rec in sources:
        for key in ["local_path", "preview_image_path"]:
            if not rec.get(key) or not Path(rec[key]).exists():
                missing_paths.append(str(rec.get(key)))
    for pair in pairs:
        for key in ["no_image_path", "af_image_path"]:
            if not pair.get(key) or not Path(pair[key]).exists():
                missing_paths.append(str(pair.get(key)))
    bad_pairs = [pair.get("pair_id") for pair in pairs if pair.get("outside_target_changed_pixels") != 0 or pair.get("bbox_ok") is not True]
    insurer_like = [rec.get("source_id") for rec in sources if rec.get("document_type") not in TARGET_DOCUMENT_TYPES]
    doc_types = sorted({rec.get("document_type") for rec in sources})
    return {
        "ok": len(sources) >= 2 and len(pairs) >= 2 and not missing_paths and not bad_pairs and not insurer_like,
        "source_count": len(sources),
        "failure_count": len(failures),
        "pair_count": len(pairs),
        "document_types": doc_types,
        "missing_paths": missing_paths,
        "bad_same_bbox_pair_ids": bad_pairs,
        "insurer_or_non_submission_source_ids": insurer_like,
        "contact_sheet_exists": bool(manifest.get("contact_sheet_path")) and Path(manifest["contact_sheet_path"]).exists(),
    }


def build_index_md(manifest: dict[str, Any], manifest_path: Path) -> str:
    lines = [
        "# 실손보험 실제 제출서류 기반 bbox 국소치환 v0.3",
        "",
        "이 산출물은 보험회사 청구서 양식이 아니라 병원/약국 제출 증빙서류 PDF/공개 샘플을 원본으로 사용한다.",
        "Case 1 원본 preview에서 PyMuPDF word bbox로 라벨을 찾고, 라벨 오른쪽 value bbox에 가명 값을 채운 뒤 같은 bbox만 AF 값으로 국소치환했다.",
        "",
        f"- manifest: `{manifest_path}`",
        f"- contact sheet: `{manifest.get('contact_sheet_path')}`",
        f"- source_count: {manifest.get('source_count')}",
        f"- field_target_count: {manifest.get('field_target_count')}",
        f"- pair_count: {manifest.get('pair_count')}",
        f"- validation_ok: {manifest.get('validation', {}).get('ok')}",
        "",
        "## 실제 외부 제출서류 원본",
        "",
        "| source_id | 문서유형 | 출처 | fields | preview | 원본 |",
        "|---|---|---|---:|---|---|",
    ]
    for rec in manifest.get("source_records", []):
        lines.append(
            f"| {rec['source_id']} | {rec['document_type_ko']} | {rec['authority']} | {rec['field_target_count']} | {Path(rec['preview_image_path']).name} | {Path(rec['local_path']).name} |"
        )
    lines += ["", "## 동일좌표 국소치환 pair", "", "| pair_id | 문서유형 | 필드 | bbox_px | NO -> AF | outside_diff | 이유 |", "|---|---|---|---|---|---:|---|"]
    for pair in manifest.get("pair_records", []):
        f = pair["changed_field"]
        lines.append(
            f"| {pair['pair_id']} | {pair['document_type_ko']} | {f['label_ko']} | {f['value_bbox_px']} | {f['no_value']} -> {f['af_value']} | {pair['outside_target_changed_pixels']} | {f['fds_reason']} |"
        )
    if manifest.get("failures"):
        lines += ["", "## 실패 후보", "", "| source_id | title | error |", "|---|---|---|"]
        for failure in manifest["failures"]:
            lines.append(f"| {failure.get('source_id')} | {str(failure.get('title')).replace('|', '/')} | {str(failure.get('error')).replace('|', '/')} |")
    return "\n".join(lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-root", default="data/insurance-fds-generated/real-submission-bbox-cycle-v0_3")
    parser.add_argument("--limit", type=int, default=None)
    args = parser.parse_args()
    manifest = collect_and_generate(Path(args.output_root), limit=args.limit)
    print(json.dumps({"validation": manifest["validation"], "output_root": args.output_root}, ensure_ascii=False, indent=2, sort_keys=True))
    return 0 if manifest["validation"]["ok"] else 2


if __name__ == "__main__":
    raise SystemExit(main())
