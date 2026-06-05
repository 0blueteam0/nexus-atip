from __future__ import annotations

from pathlib import Path
from statistics import median
from typing import Iterable

from PIL import Image, ImageOps


IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".tif", ".tiff", ".bmp"}


def _quantiles(values: list[float]) -> dict:
    """작은 참조셋에서도 안정적으로 동작하는 단순 분포 요약을 만든다."""

    if not values:
        return {"min": 0, "median": 0, "max": 0}
    ordered = sorted(values)
    return {
        "min": round(float(ordered[0]), 4),
        "median": round(float(median(ordered)), 4),
        "max": round(float(ordered[-1]), 4),
    }


def _iter_images(reference_dir: Path) -> Iterable[Path]:
    for path in sorted(reference_dir.rglob("*")):
        if path.is_file() and path.suffix.lower() in IMAGE_SUFFIXES:
            yield path


def _image_stats(path: Path) -> dict:
    """이미지 자체나 OCR 텍스트를 저장하지 않고 안전한 레이아웃 통계만 계산한다.

    실제 참조 이미지는 충실도 보정을 위한 분포 추정에만 사용한다. 파일명은
    운영 추적용 fingerprint 목록에만 남기며, 학습 산출물에는 원본 픽셀을 복사하지 않는다.
    """

    image = Image.open(path).convert("RGB")
    gray = ImageOps.grayscale(image)
    hist = gray.histogram()
    total = max(1, sum(hist))
    mean = sum(i * count for i, count in enumerate(hist)) / total
    variance = sum(((i - mean) ** 2) * count for i, count in enumerate(hist)) / total

    # 밝은 종이 배경에서 어두운 선/글자/테두리만 foreground로 본다.
    foreground = gray.point(lambda x: 255 if x < 245 else 0)
    bbox = foreground.getbbox() or (0, 0, image.width, image.height)
    bbox_w = max(1, bbox[2] - bbox[0])
    bbox_h = max(1, bbox[3] - bbox[1])
    coverage = (bbox_w * bbox_h) / max(1, image.width * image.height)
    margins = {
        "left_ratio": bbox[0] / image.width,
        "top_ratio": bbox[1] / image.height,
        "right_ratio": (image.width - bbox[2]) / image.width,
        "bottom_ratio": (image.height - bbox[3]) / image.height,
    }
    orientation = "portrait" if image.height >= image.width else "landscape_or_crop"
    return {
        "file_name": path.name,
        "width": image.width,
        "height": image.height,
        "aspect_ratio": image.width / image.height,
        "orientation_hint": orientation,
        "gray_mean": mean,
        "gray_std": variance ** 0.5,
        "foreground_coverage_ratio": coverage,
        "content_bbox_ratio": [bbox[0] / image.width, bbox[1] / image.height, bbox[2] / image.width, bbox[3] / image.height],
        "margin_ratios": margins,
    }


def profile_reference_set(reference_dir: str | Path, profile_id: str = "reference_profile") -> dict:
    """허가된 안전 참조셋에서 v4 synthetic lab용 통계 프로파일을 추출한다.

    이 함수는 PII/기관명/텍스트를 추출하지 않는다. 실제 이미지 픽셀도 출력물에
    포함하지 않는다. 결과 JSON은 템플릿 샘플러가 사용할 수 있는 분포 정보만 담는다.
    """

    root = Path(reference_dir)
    records = [_image_stats(path) for path in _iter_images(root)] if root.exists() else []
    aspects = [r["aspect_ratio"] for r in records]
    means = [r["gray_mean"] for r in records]
    stds = [r["gray_std"] for r in records]
    coverages = [r["foreground_coverage_ratio"] for r in records]
    top_margins = [r["margin_ratios"]["top_ratio"] for r in records]
    left_margins = [r["margin_ratios"]["left_ratio"] for r in records]
    return {
        "schema_version": "reference_profile.v1",
        "profile_id": profile_id,
        "safety": {
            "authorized_safe_reference_only": True,
            "stores_source_pixels": False,
            "ocr_text_extracted": False,
            "copies_real_layout_exactly": False,
            "intended_use": "defensive_fds_synthetic_calibration_only",
        },
        "document_count": len(records),
        "source_fingerprints": [r["file_name"] for r in records],
        "aggregate": {
            "page_aspect_ratio": _quantiles(aspects),
            "gray_mean": _quantiles(means),
            "gray_std": _quantiles(stds),
            "foreground_coverage_ratio": _quantiles(coverages),
            "top_margin_ratio": _quantiles(top_margins),
            "left_margin_ratio": _quantiles(left_margins),
        },
        "records": records,
    }
