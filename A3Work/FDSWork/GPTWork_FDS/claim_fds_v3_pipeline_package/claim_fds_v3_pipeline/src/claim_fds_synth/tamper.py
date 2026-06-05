from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Tuple
import copy
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

from .claim_data import ClaimCase, won
from .degradation import jpeg_roundtrip
from .layout import Box, draw_text_box, LayoutAudit


@dataclass
class TamperResult:
    image: Image.Image
    mask: Image.Image
    changed_fields: List[dict]
    tampered_claim: ClaimCase


def _safe_box(box: Box, w: int, h: int, margin: int = 2) -> Box:
    x1,y1,x2,y2 = box
    return max(0,x1-margin), max(0,y1-margin), min(w,x2+margin), min(h,y2+margin)


def _erase_field_with_local_background(img: Image.Image, box: Box, seed: int = 0) -> Image.Image:
    rng = np.random.default_rng(seed)
    arr = np.array(img.convert("RGB")).astype(np.float32)
    h, w = arr.shape[:2]
    x1,y1,x2,y2 = _safe_box(box, w, h, margin=1)
    # Use local pixels near field boundary, excluding dark text-heavy pixels.
    ex = max(0, x1-16); ey = max(0, y1-16); ex2 = min(w, x2+16); ey2 = min(h, y2+16)
    patch = arr[ey:ey2, ex:ex2, :]
    lum = patch.mean(axis=2)
    bg_pixels = patch[lum > np.percentile(lum, 62)]
    if len(bg_pixels) < 20:
        bg_pixels = patch.reshape(-1,3)
    med = np.median(bg_pixels, axis=0)
    noise = rng.normal(0, 2.0, (y2-y1, x2-x1, 3))
    arr[y1:y2, x1:x2, :] = med + noise
    # Feather the edges for plausible edit patch boundary.
    out = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGB")
    return out


def post_scan_local_tamper(
    scanned_img: Image.Image,
    clean_claim: ClaimCase,
    field_bboxes: Dict[str, Box],
    font_paths: Dict[str, str],
    seed: int = 0,
) -> TamperResult:
    """Defensive synthetic local tampering: edit only selected fields and output exact masks."""
    img = scanned_img.convert("RGB")
    W, H = img.size
    mask = Image.new("L", (W, H), 0)
    md = ImageDraw.Draw(mask)
    changed: List[dict] = []
    tampered = copy.deepcopy(clean_claim)

    # Field changes intentionally break consistency with detail line-item totals.
    delta = 100000
    target_changes = {
        "total_medical_fee": clean_claim.summary["total_medical_fee"] + delta,
        "patient_burden_total": clean_claim.summary["patient_burden_total"] + delta,
        "amount_due": clean_claim.summary["amount_due"] + delta,
        "paid_by_card": clean_claim.summary["paid_by_card"] + delta,
        "paid_total": clean_claim.summary["paid_total"] + delta,
        "issue_date": "2026-07-03",
    }
    for k, v in target_changes.items():
        if k in tampered.summary:
            tampered.summary[k] = int(v) if isinstance(v, int) else v  # type: ignore[assignment]
        elif k == "issue_date":
            tampered.issue_date = str(v)

    draw = ImageDraw.Draw(img)
    audit = LayoutAudit((0,0,W,H))
    for idx, (field, new_val) in enumerate(target_changes.items()):
        if field not in field_bboxes:
            continue
        box = field_bboxes[field]
        # Use a smaller text bbox inside the cell to avoid overwriting the borders.
        x1,y1,x2,y2 = box
        inner = (x1+5, y1+4, x2-5, y2-4)
        img = _erase_field_with_local_background(img, inner, seed=seed+idx)
        draw = ImageDraw.Draw(img)
        md.rectangle(inner, fill=255)
        text = won(new_val) if isinstance(new_val, int) else str(new_val)
        label = f"tamper.{field}"
        draw_text_box(
            draw, audit, inner, text,
            font_paths.get("mono", font_paths.get("primary")),
            max_size=17 if field != "issue_date" else 14,
            min_size=8,
            fill=(22,22,22),
            align="right" if field != "issue_date" else "left",
            pad=7,
            label=label,
        )
        changed.append({
            "field": field,
            "old": won(clean_claim.summary[field]) if field in clean_claim.summary else getattr(clean_claim, field),
            "new": text,
            "bbox": list(inner),
            "attack_type": "post_scan_local_field_replacement",
        })
    # Compression after edit creates plausible but detectable local compression discrepancy.
    img = img.filter(ImageFilter.GaussianBlur(radius=0.06))
    img = jpeg_roundtrip(img, quality=74)
    return TamperResult(img, mask, changed, tampered)
