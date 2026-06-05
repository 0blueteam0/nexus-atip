"""Reference image profile extraction for Korean claim-document FDS synthesis.

This module is intentionally OCR-light. It extracts geometry/table/capture/color
statistics from authorized reference images so the generator can calibrate visual
fidelity without copying sensitive content.

Usage:
    python scripts/profile_reference_images.py --images /path/a.jpg /path/b.png --out outputs/profiles.json
"""
from __future__ import annotations

from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Iterable, Optional, Any
import json
import math

import cv2
import numpy as np


@dataclass
class ImageProfile:
    file: str
    width: int
    height: int
    aspect_ratio_w_over_h: float
    estimated_content_bbox_xyxy: Optional[list[int]]
    content_bbox_coverage: float
    mean_gray: float
    std_gray: float
    laplacian_blur_var: float
    edge_density: float
    hough_line_count: int
    hough_line_count_per_mp: float
    horizontal_line_count: int
    vertical_line_count: int
    estimated_horizontal_skew_deg: Optional[float]
    horizontal_angle_spread_deg: Optional[float]
    vertical_angle_spread_deg: Optional[float]
    blue_line_pixel_ratio: float
    red_stamp_pixel_ratio: float
    purple_ink_pixel_ratio: float
    background_bgr_mean: list[float]
    background_bgr_std: list[float]
    capture_profile_guess: str
    style_tags: list[str]
    quality_tags: list[str]


def _angle_norm(theta: float) -> float:
    while theta <= -90:
        theta += 180
    while theta > 90:
        theta -= 180
    return theta


def _round_list(values: Iterable[float], ndigits: int = 2) -> list[float]:
    return [round(float(v), ndigits) for v in values]


def infer_tags(profile: dict[str, Any]) -> tuple[list[str], list[str]]:
    style: list[str] = []
    quality: list[str] = []
    if profile["blue_line_pixel_ratio"] > 0.02:
        style.append("blue_or_cyan_grid")
    else:
        style.append("gray_black_grid")
    if profile["red_stamp_pixel_ratio"] > 0.002:
        style.append("red_stamp_or_seal")
    if profile["purple_ink_pixel_ratio"] > 0.001:
        style.append("purple_stamp_or_handwriting")
    if profile["aspect_ratio_w_over_h"] > 1.25:
        style.append("landscape_or_wide_crop")
    elif profile["aspect_ratio_w_over_h"] < 0.72:
        style.append("portrait_a4_like")
    if profile["hough_line_count_per_mp"] > 800:
        style.append("dense_table_grid")
    if abs(profile["estimated_horizontal_skew_deg"] or 0) > 3:
        quality.append("strong_skew_or_oblique_photo")
    if profile["laplacian_blur_var"] < 600:
        quality.append("soft_or_motion_blurred")
    if profile["content_bbox_coverage"] < 0.9:
        quality.append("cropped_or_partial_page")
    if profile["mean_gray"] < 190:
        quality.append("dark_or_warm_mobile_capture")
    if profile["edge_density"] > 0.18:
        quality.append("sharp_dense_lines_or_screenshot")
    return style, quality


def extract_profile(path: str | Path, max_side: int = 1400) -> ImageProfile:
    path = Path(path)
    img = cv2.imread(str(path), cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError(f"Cannot read image: {path}")
    h, w = img.shape[:2]
    scale = min(1.0, max_side / max(h, w))
    small = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA) if scale < 1 else img.copy()
    gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
    hsv = cv2.cvtColor(small, cv2.COLOR_BGR2HSV)
    H, S, V = cv2.split(hsv)

    edges = cv2.Canny(gray, 50, 150, apertureSize=3)
    min_line_length = max(30, min(small.shape[:2]) // 10)
    lines = cv2.HoughLinesP(edges, 1, np.pi / 180, threshold=80, minLineLength=min_line_length, maxLineGap=8)

    angles: list[float] = []
    horizontal = 0
    vertical = 0
    if lines is not None:
        for line in lines[:, 0, :]:
            x1, y1, x2, y2 = map(float, line)
            dx, dy = x2 - x1, y2 - y1
            length = math.hypot(dx, dy)
            if length < 20:
                continue
            angle = _angle_norm(math.degrees(math.atan2(dy, dx)))
            angles.append(angle)
            if abs(angle) < 8:
                horizontal += 1
            if abs(abs(angle) - 90) < 8:
                vertical += 1

    h_angles = [a for a in angles if abs(a) < 15]
    v_angles = [_angle_norm(a - 90 if a > 0 else a + 90) for a in angles if abs(abs(a) - 90) < 15]
    skew = float(np.median(h_angles)) if h_angles else None
    h_spread = float(np.std(h_angles)) if len(h_angles) > 2 else None
    v_spread = float(np.std(v_angles)) if len(v_angles) > 2 else None

    colored = (S > 35) & (V < 245) & (gray < 245)
    blue = colored & (H >= 85) & (H <= 135)
    red = colored & ((H <= 10) | (H >= 170))
    purple = colored & (H >= 135) & (H <= 165)

    bg_mask = (gray > 180) & (S < 70)
    bg_pixels = small[bg_mask] if int(bg_mask.sum()) > 0 else small.reshape(-1, 3)

    dark = gray < 210
    ys, xs = np.where(dark)
    bbox = None
    coverage = 0.0
    if len(xs) > 0:
        bbox = [int(xs.min() / scale), int(ys.min() / scale), int(xs.max() / scale), int(ys.max() / scale)]
        coverage = float((xs.max() - xs.min() + 1) * (ys.max() - ys.min() + 1) / (small.shape[0] * small.shape[1]))

    line_count = int(0 if lines is None else len(lines))
    mp = (small.shape[0] * small.shape[1]) / 1e6
    capture_guess = "flat_scan_or_screenshot"
    if abs(skew or 0) > 1.5 or (h_spread and h_spread > 1.3):
        capture_guess = "camera_or_skewed_scan"
    if coverage < 0.75:
        capture_guess = "partial_crop_or_closeup"
    if float(cv2.Laplacian(gray, cv2.CV_64F).var()) < 80:
        capture_guess = "very_soft_scan_or_photo"

    raw = {
        "file": path.name,
        "width": w,
        "height": h,
        "aspect_ratio_w_over_h": round(w / h, 4),
        "estimated_content_bbox_xyxy": bbox,
        "content_bbox_coverage": round(coverage, 4),
        "mean_gray": round(float(gray.mean()), 2),
        "std_gray": round(float(gray.std()), 2),
        "laplacian_blur_var": round(float(cv2.Laplacian(gray, cv2.CV_64F).var()), 2),
        "edge_density": round(float(edges.mean() / 255.0), 4),
        "hough_line_count": line_count,
        "hough_line_count_per_mp": round(line_count / max(mp, 1e-6), 1),
        "horizontal_line_count": int(horizontal),
        "vertical_line_count": int(vertical),
        "estimated_horizontal_skew_deg": None if skew is None else round(skew, 3),
        "horizontal_angle_spread_deg": None if h_spread is None else round(h_spread, 3),
        "vertical_angle_spread_deg": None if v_spread is None else round(v_spread, 3),
        "blue_line_pixel_ratio": round(float(blue.sum() / blue.size), 5),
        "red_stamp_pixel_ratio": round(float(red.sum() / red.size), 5),
        "purple_ink_pixel_ratio": round(float(purple.sum() / purple.size), 5),
        "background_bgr_mean": _round_list(bg_pixels.mean(axis=0)),
        "background_bgr_std": _round_list(bg_pixels.std(axis=0)),
        "capture_profile_guess": capture_guess,
    }
    style_tags, quality_tags = infer_tags(raw)
    return ImageProfile(**raw, style_tags=style_tags, quality_tags=quality_tags)


def extract_many(paths: Iterable[str | Path]) -> list[ImageProfile]:
    return [extract_profile(p) for p in paths]


def save_profiles(profiles: list[ImageProfile], out_path: str | Path) -> None:
    out = [asdict(p) for p in profiles]
    Path(out_path).write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
