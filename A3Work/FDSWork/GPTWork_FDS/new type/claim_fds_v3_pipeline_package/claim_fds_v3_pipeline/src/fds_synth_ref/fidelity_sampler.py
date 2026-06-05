"""Sample generator parameters from reference profiles.

The renderer should consume these sampled parameters instead of hard-coding one
clean digital layout. This is the core reference-calibrated direction.
"""
from __future__ import annotations

from dataclasses import dataclass, asdict
from typing import Any
import random


@dataclass
class RenderStyleSample:
    visual_cluster: str
    page_scope: str
    line_color_family: str
    hough_line_density_target: float
    skew_deg: float
    blur_var_target: float
    blue_ratio_target: float
    red_stamp_probability: float
    purple_annotation_probability: float
    background_tone_bgr: tuple[float, float, float]
    damage_tags: list[str]
    capture_profile: str


def sample_from_profiles(profiles: list[dict[str, Any]], rng: random.Random | None = None) -> RenderStyleSample:
    rng = rng or random.Random()
    p = rng.choice(profiles)
    blue = float(p.get("blue_line_pixel_ratio", 0))
    line_color_family = "blue" if blue > 0.02 else "gray_black"
    scope = p.get("document_scope") or ("landscape_or_crop" if p.get("aspect_ratio_w_over_h", 0) > 1.2 else "full_or_portrait")
    damage_tags: list[str] = []
    if "cropped_or_partial_page" in p.get("quality_tags", []) or p.get("content_bbox_coverage", 1) < 0.9:
        damage_tags.append("partial_crop")
    if p.get("capture_profile_guess") == "camera_or_skewed_scan":
        damage_tags.append("perspective")
    if p.get("red_stamp_pixel_ratio", 0) > 0.002:
        damage_tags.append("stamp_layer")
    if p.get("purple_ink_pixel_ratio", 0) > 0.001:
        damage_tags.append("pen_annotation_layer")
    return RenderStyleSample(
        visual_cluster=p.get("visual_cluster", "unknown_cluster"),
        page_scope=scope,
        line_color_family=line_color_family,
        hough_line_density_target=float(p.get("hough_line_count_per_mp", 500)),
        skew_deg=float(p.get("estimated_horizontal_skew_deg") or 0.0),
        blur_var_target=float(p.get("laplacian_blur_var", 1000)),
        blue_ratio_target=blue,
        red_stamp_probability=min(0.8, max(0.05, 50 * float(p.get("red_stamp_pixel_ratio", 0)))) ,
        purple_annotation_probability=min(0.7, max(0.0, 40 * float(p.get("purple_ink_pixel_ratio", 0)))) ,
        background_tone_bgr=tuple(float(x) for x in p.get("background_bgr_mean", [240, 240, 240])),
        damage_tags=damage_tags,
        capture_profile=p.get("capture_profile_guess", "flat_scan_or_screenshot"),
    )


def as_jsonable(sample: RenderStyleSample) -> dict[str, Any]:
    d = asdict(sample)
    d["background_tone_bgr"] = list(sample.background_tone_bgr)
    return d
