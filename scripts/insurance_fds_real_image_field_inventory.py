#!/usr/bin/env python
"""보험 FDS real-image NO 후보의 field inventory를 만드는 안전 게이트.

이 스크립트는 AF/tamper 이미지를 만들기 전에 반드시 필요한 중간 산출물을 생성한다.
핵심 목표는 실제 웹 기반 NO derivative 이미지에서 값 후보의 좌표를 먼저 확인하고,
값이 확인되지 않은 필드는 변조 생성 대상에서 차단하는 것이다.

운영 원칙:
- 원본 이미지를 학습용으로 승격하지 않고 field review 후보만 만든다.
- 이미지 픽셀 안에는 마스크, 블럭, 합성전용, 실제 제출불가 같은 shortcut artifact를 렌더링하지 않는다.
- overlay PNG는 사람이 검수하는 별도 review artifact이며, NO/AF 학습 이미지가 아니다.
- 실제값은 후속 pseudonymization 단계에서 반드시 fake/synthetic 값으로 교체되어야 한다.
"""

from __future__ import annotations

import argparse
import json
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

from PIL import Image, ImageDraw, ImageFont

DATASET_VERSION = "insurance-fds-real-image-field-inventory-v1"


@dataclass(frozen=True)
class TextRegion:
    """paired NO 이미지 좌표계에서 찾은 텍스트 후보 영역."""

    bbox_xyxy: tuple[int, int, int, int]
    dark_pixels: int
    value_text: str
    bbox_source: str = "pixel_text_region"


def now_iso() -> str:
    """UTC ISO timestamp를 반환한다."""

    return datetime.now(timezone.utc).isoformat()


def safe_font(size: int = 14) -> ImageFont.ImageFont:
    """검수 overlay에 사용할 기본 폰트를 로드한다."""

    for candidate in ["C:/Windows/Fonts/malgun.ttf", "C:/Windows/Fonts/arial.ttf"]:
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size=max(8, size))
    return ImageFont.load_default()


def _pixel_values(image: Image.Image):
    """Pillow 버전 차이를 흡수해 픽셀 iterator를 반환한다."""

    if hasattr(image, "get_flattened_data"):
        return image.get_flattened_data()
    return image.getdata()


def load_no_records(source_root: Path) -> list[dict[str, Any]]:
    """real-image-redteam index/manifest에서 NO 이미지 record만 읽는다."""

    index_path = source_root / "indexes" / "real_image_redteam_index.json"
    manifest_path = source_root / "manifests" / "real_image_redteam_manifest.json"
    if index_path.exists():
        records = json.loads(index_path.read_text(encoding="utf-8"))
    elif manifest_path.exists():
        records = json.loads(manifest_path.read_text(encoding="utf-8")).get("records", [])
    else:
        raise FileNotFoundError(f"missing real-image-redteam index/manifest under {source_root}")
    return [row for row in records if row.get("prefix") == "NO" and row.get("local_image_path")]


def _is_dark(pixel: tuple[int, int, int], threshold: int = 125) -> bool:
    """문서 글자/선 후보로 볼 만큼 어두운 픽셀인지 판단한다."""

    r, g, b = pixel
    return (r * 0.299 + g * 0.587 + b * 0.114) < threshold


def _group_contiguous(values: Iterable[int], max_gap: int = 1) -> list[tuple[int, int]]:
    """정렬된 index 목록을 연속 구간으로 묶는다."""

    values = list(values)
    if not values:
        return []
    groups: list[tuple[int, int]] = []
    start = prev = values[0]
    for value in values[1:]:
        if value - prev <= max_gap:
            prev = value
            continue
        groups.append((start, prev + 1))
        start = prev = value
    groups.append((start, prev + 1))
    return groups


def _ocr_proxy_value(image: Image.Image, bbox: tuple[int, int, int, int]) -> str:
    """OCR 없는 환경에서 좌표 후보의 값 상태를 표현하는 placeholder를 만든다.

    실제 OCR 결과가 아니라는 점을 명확히 하기 위해 원문 값을 추정하거나 저장하지 않는다.
    dark-pixel 후보가 실제 문서값일 가능성이 있다는 사실만 field inventory에 남긴다.
    """

    x1, y1, x2, y2 = bbox
    return f"pixel_text_region:{x1},{y1},{x2},{y2}"


def find_text_regions(image: Image.Image) -> list[TextRegion]:
    """이미지에서 작은 텍스트형 dark-pixel 후보를 찾는다.

    OCR 엔진이 없는 테스트/로컬 환경에서도 collection error 없이 field inventory를 만들기 위한 MVP다.
    bbox는 이미지 비율로 임의 생성하지 않고 실제 어두운 픽셀 분포에서만 나온다.

    구현 메모:
    단순 row-projection은 영수증 테두리의 세로선 때문에 모든 행이 하나로 이어질 수 있다.
    그래서 먼저 connected component로 긴 선/테두리를 제거하고, 남은 작은 글자 컴포넌트를 같은 행의 단어 후보로 묶는다.
    """

    rgb = image.convert("RGB")
    width, height = rgb.size
    pixels = rgb.load()
    visited: set[tuple[int, int]] = set()
    components: list[tuple[int, int, int, int, int]] = []

    for start_y in range(height):
        for start_x in range(width):
            if (start_x, start_y) in visited or not _is_dark(pixels[start_x, start_y]):
                continue
            stack = [(start_x, start_y)]
            visited.add((start_x, start_y))
            xs: list[int] = []
            ys: list[int] = []
            while stack:
                x, y = stack.pop()
                xs.append(x)
                ys.append(y)
                for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                    if nx < 0 or ny < 0 or nx >= width or ny >= height or (nx, ny) in visited:
                        continue
                    if _is_dark(pixels[nx, ny]):
                        visited.add((nx, ny))
                        stack.append((nx, ny))
            x1, x2 = min(xs), max(xs) + 1
            y1, y2 = min(ys), max(ys) + 1
            comp_w = x2 - x1
            comp_h = y2 - y1
            dark_count = len(xs)
            # 긴 테두리/가로선/세로선 제거. 작은 글자 stroke와 숫자 stroke만 남긴다.
            if comp_w > width * 0.35 or comp_h > height * 0.25:
                continue
            if comp_w <= 1 and comp_h > 20:
                continue
            if comp_h <= 1 and comp_w > 20:
                continue
            if dark_count < 2:
                continue
            components.append((x1, y1, x2, y2, dark_count))

    # 같은 행에 놓인 글자 컴포넌트를 단어/값 후보로 병합한다.
    components.sort(key=lambda item: (item[1], item[0]))
    lines: list[list[tuple[int, int, int, int, int]]] = []
    for component in components:
        x1, y1, x2, y2, _dark = component
        placed = False
        for line in lines:
            ly1 = min(item[1] for item in line)
            ly2 = max(item[3] for item in line)
            if y1 <= ly2 + 3 and y2 >= ly1 - 3:
                line.append(component)
                placed = True
                break
        if not placed:
            lines.append([component])

    regions: list[TextRegion] = []
    for line in lines:
        line.sort(key=lambda item: item[0])
        current: list[tuple[int, int, int, int, int]] = []
        prev_x2: int | None = None
        for component in line:
            x1, _y1, x2, _y2, _dark = component
            if prev_x2 is None or x1 - prev_x2 <= 14:
                current.append(component)
            else:
                _append_word_region(regions, current, rgb.size, rgb)
                current = [component]
            prev_x2 = x2
        _append_word_region(regions, current, rgb.size, rgb)

    # 중복/포함 관계를 정리해 review 대상이 너무 커지지 않도록 한다.
    return _dedupe_regions(regions)


def _append_word_region(regions: list[TextRegion], components: list[tuple[int, int, int, int, int]], size: tuple[int, int], image: Image.Image) -> None:
    """한 행에서 묶은 컴포넌트들을 field 후보 하나로 추가한다."""

    if not components:
        return
    x1 = min(item[0] for item in components)
    y1 = min(item[1] for item in components)
    x2 = max(item[2] for item in components)
    y2 = max(item[3] for item in components)
    dark_count = sum(item[4] for item in components)
    box_w = x2 - x1
    box_h = y2 - y1
    width, height = size
    if not (6 <= box_w <= max(16, int(width * 0.30))):
        return
    if not (3 <= box_h <= max(24, int(height * 0.04))):
        return
    bbox = _expand_bbox((x1, y1, x2, y2), size, pad=2)
    regions.append(TextRegion(bbox_xyxy=bbox, dark_pixels=dark_count, value_text=_ocr_proxy_value(image, bbox)))


def _expand_bbox(bbox: tuple[int, int, int, int], size: tuple[int, int], pad: int = 2) -> tuple[int, int, int, int]:
    """작은 글자 anti-aliasing 여백을 포함하도록 bbox를 확장한다."""

    x1, y1, x2, y2 = bbox
    width, height = size
    return max(0, x1 - pad), max(0, y1 - pad), min(width, x2 + pad), min(height, y2 + pad)


def _dedupe_regions(regions: list[TextRegion]) -> list[TextRegion]:
    """거의 같은 bbox 후보를 하나로 줄인다."""

    deduped: list[TextRegion] = []
    for region in sorted(regions, key=lambda row: (row.bbox_xyxy[1], row.bbox_xyxy[0])):
        x1, y1, x2, y2 = region.bbox_xyxy
        duplicate = False
        for existing in deduped:
            ex1, ey1, ex2, ey2 = existing.bbox_xyxy
            if abs(x1 - ex1) <= 3 and abs(y1 - ey1) <= 3 and abs(x2 - ex2) <= 3 and abs(y2 - ey2) <= 3:
                duplicate = True
                break
        if not duplicate:
            deduped.append(region)
    return deduped


def classify_field_family(value_text: str, bbox: tuple[int, int, int, int], image_size: tuple[int, int]) -> str:
    """값 후보의 family를 보수적으로 분류한다."""

    # OCR proxy만 있을 때는 좌표/형태 기반 약한 분류만 한다.
    if re.search(r"\d{4}[-./]\d{1,2}[-./]\d{1,2}", value_text):
        return "date_candidate"
    if re.search(r"\d[\d,]{2,}", value_text):
        return "amount_candidate"
    if re.search(r"[A-Z]{1,4}[-_]?[0-9]{2,}", value_text):
        return "receipt_number_candidate"
    x1, _y1, x2, _y2 = bbox
    width, _height = image_size
    if x1 > width * 0.55 or x2 > width * 0.70:
        return "amount_candidate"
    return "unknown_text_candidate"


def build_inventory_policy() -> dict[str, Any]:
    """AF 생성 전 field inventory가 강제된다는 정책을 반환한다."""

    return {
        "tamper_generation_allowed_without_field_inventory": False,
        "requires_field_value_before_tamper": True,
        "requires_manual_review_for_unconfirmed_values": True,
        "visible_mask_block_or_submission_invalid_label_allowed_in_training_image": False,
        "raw_public_value_retention_allowed_in_training_manifest": False,
    }


def is_field_ready_for_tamper(field: dict[str, Any]) -> bool:
    """값이 확인된 field만 후속 pinpoint tamper 후보로 허용한다."""

    return bool(field.get("value_text")) and field.get("value_status") == "ocr_extracted"


def make_field_record(dataset_id: str, region: TextRegion, index: int, image_size: tuple[int, int]) -> dict[str, Any]:
    """TextRegion을 manifest용 field record로 변환한다."""

    family = classify_field_family(region.value_text, region.bbox_xyxy, image_size)
    # 현재 MVP는 OCR 엔진이 없는 pixel inventory이므로 값은 확인 전 상태로 둔다.
    value_status = "manual_review_required"
    tamper_eligibility = "blocked_until_value_confirmed"
    return {
        "field_id": f"{dataset_id}_FIELD_{index:04d}",
        "bbox_xyxy": list(region.bbox_xyxy),
        "bbox_source": region.bbox_source,
        "field_family": family,
        "value_text": region.value_text,
        "value_status": value_status,
        "tamper_eligibility": tamper_eligibility,
        "evidence": {
            "paired_no_dataset_id": dataset_id,
            "dark_pixel_count": region.dark_pixels,
            "extraction_method": "dark_pixel_text_region_inventory_mvp",
        },
    }


def write_overlay(image: Image.Image, fields: list[dict[str, Any]], path: Path) -> None:
    """사람 검수용 field 후보 overlay를 별도 PNG로 저장한다."""

    out = image.convert("RGB").copy()
    draw = ImageDraw.Draw(out)
    font = safe_font(11)
    for index, field in enumerate(fields, start=1):
        x1, y1, x2, y2 = field["bbox_xyxy"]
        color = (40, 120, 220)
        draw.rectangle((x1, y1, x2, y2), outline=color, width=2)
        draw.text((x1, max(0, y1 - 13)), f"F{index}", fill=color, font=font)
    path.parent.mkdir(parents=True, exist_ok=True)
    out.save(path)


def build_document_inventory(source_root: Path, output_root: Path, record: dict[str, Any]) -> dict[str, Any]:
    """단일 NO 이미지의 field candidate 문서를 생성한다."""

    image_path = source_root / record["local_image_path"]
    image = Image.open(image_path).convert("RGB")
    regions = find_text_regions(image)
    fields = [make_field_record(record["dataset_id"], region, index, image.size) for index, region in enumerate(regions, start=1)]
    dataset_id = record["dataset_id"]
    document = {
        "inventory_version": DATASET_VERSION,
        "created_at": now_iso(),
        "dataset_id": dataset_id,
        "source_dataset_id": record.get("source_dataset_id"),
        "source_url": record.get("source_url"),
        "source_page_url": record.get("source_page_url"),
        "privacy_review_status": record.get("privacy_review_status", "derived_quarantine_requires_manual_pii_review"),
        "redistribution_status": record.get("redistribution_status", "unknown_requires_source_review"),
        "document_type_guess": record.get("document_type_guess", "unknown_real_image_candidate"),
        "image_width": image.width,
        "image_height": image.height,
        "coordinate_system": "paired_no_image_pixel_xyxy",
        "inventory_policy": build_inventory_policy(),
        "fields": fields,
    }

    doc_path = output_root / "field-candidates" / f"{dataset_id}.fields.json"
    overlay_path = output_root / "overlays" / f"{dataset_id}.fields.png"
    review_path = output_root / "review-queue" / f"{dataset_id}.review.json"
    doc_path.parent.mkdir(parents=True, exist_ok=True)
    review_path.parent.mkdir(parents=True, exist_ok=True)
    doc_path.write_text(json.dumps(document, ensure_ascii=False, indent=2, sort_keys=True), encoding="utf-8")
    write_overlay(image, fields, overlay_path)
    review_path.write_text(
        json.dumps(
            {
                "dataset_id": dataset_id,
                "review_reason": "field_values_require_ocr_or_manual_confirmation_before_tamper",
                "source_url": document["source_url"],
                "source_page_url": document["source_page_url"],
                "field_count": len(fields),
                "blocked_field_count": sum(1 for field in fields if not is_field_ready_for_tamper(field)),
                "next_action": "confirm_value_text_and_pseudonymization_target_without_copying_real_pii_to_training_outputs",
            },
            ensure_ascii=False,
            indent=2,
            sort_keys=True,
        ),
        encoding="utf-8",
    )
    return document


def build_field_inventory(source_root: Path, output_root: Path, max_no: int = 10) -> dict[str, Any]:
    """real-image NO 후보들의 field inventory manifest를 생성한다."""

    output_root.mkdir(parents=True, exist_ok=True)
    records = load_no_records(source_root)[:max_no]
    documents = [build_document_inventory(source_root, output_root, record) for record in records]
    manifest = {
        "manifest_version": DATASET_VERSION,
        "created_at": now_iso(),
        "source_root": source_root.as_posix(),
        "document_count": len(documents),
        "field_candidate_count": sum(len(document["fields"]) for document in documents),
        "inventory_policy": build_inventory_policy(),
        "documents": [
            {
                "dataset_id": document["dataset_id"],
                "field_count": len(document["fields"]),
                "field_candidates_path": f"field-candidates/{document['dataset_id']}.fields.json",
                "overlay_path": f"overlays/{document['dataset_id']}.fields.png",
                "review_queue_path": f"review-queue/{document['dataset_id']}.review.json",
                "privacy_review_status": document["privacy_review_status"],
                "source_url": document["source_url"],
                "source_page_url": document["source_page_url"],
            }
            for document in documents
        ],
    }
    manifest_path = output_root / "manifests" / "field_inventory_manifest.json"
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True), encoding="utf-8")
    return {"document_count": manifest["document_count"], "field_candidate_count": manifest["field_candidate_count"]}


def parse_args() -> argparse.Namespace:
    """CLI 인자를 파싱한다."""

    parser = argparse.ArgumentParser(description="Build insurance FDS real-image field inventory before tamper generation.")
    parser.add_argument("--source-root", type=Path, default=Path("data/insurance-fds-generated/real-image-redteam-v1"))
    parser.add_argument("--output-root", type=Path, default=Path("data/insurance-fds-generated/real-image-field-inventory-v1"))
    parser.add_argument("--max-no", type=int, default=10)
    return parser.parse_args()


def main() -> None:
    """CLI entrypoint."""

    args = parse_args()
    result = build_field_inventory(args.source_root, args.output_root, max_no=args.max_no)
    print(json.dumps({"output_root": args.output_root.as_posix(), **result}, ensure_ascii=False, sort_keys=True))


if __name__ == "__main__":
    main()
