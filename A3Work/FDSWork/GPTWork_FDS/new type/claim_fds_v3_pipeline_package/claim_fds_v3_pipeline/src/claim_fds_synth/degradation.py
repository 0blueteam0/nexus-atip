from __future__ import annotations

from typing import Tuple
import io
import math
import random
import numpy as np
import cv2
from PIL import Image, ImageFilter, ImageEnhance


def _to_np(img: Image.Image) -> np.ndarray:
    return np.array(img.convert("RGB"))


def _to_img(arr: np.ndarray) -> Image.Image:
    arr = np.clip(arr, 0, 255).astype(np.uint8)
    return Image.fromarray(arr, "RGB")


def jpeg_roundtrip(img: Image.Image, quality: int = 72) -> Image.Image:
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=quality, subsampling=2, optimize=False)
    buf.seek(0)
    return Image.open(buf).convert("RGB")


def scanner_effect(img: Image.Image, seed: int = 0, quality: int = 78) -> Image.Image:
    """No geometric transform. Keeps field bboxes valid while adding scanner-like artifacts."""
    rng = np.random.default_rng(seed)
    arr = _to_np(img).astype(np.float32)
    h, w = arr.shape[:2]
    # Low-frequency paper background variance.
    small = rng.normal(0, 1, (max(4, h // 64), max(4, w // 64))).astype(np.float32)
    low = cv2.resize(small, (w, h), interpolation=cv2.INTER_CUBIC)
    low = cv2.GaussianBlur(low, (0, 0), 25)
    arr += low[:, :, None] * 5.0
    # Horizontal scanner banding.
    y = np.arange(h).reshape(-1, 1)
    band = 2.8 * np.sin(y / 14.0 + seed) + 1.3 * np.sin(y / 47.0 + seed * 0.2)
    arr += band[:, :, None]
    # Slight channel-independent dust specks.
    speck = rng.random((h, w))
    dust = speck > 0.9993
    arr[dust] -= rng.uniform(18, 50)
    # Tiny line dropout.
    for _ in range(8):
        yy = int(rng.integers(80, h - 80))
        alpha = float(rng.uniform(0.08, 0.18))
        arr[yy:yy+1, :, :] = arr[yy:yy+1, :, :] * (1 - alpha) + 255 * alpha
    out = _to_img(arr)
    out = out.filter(ImageFilter.GaussianBlur(radius=0.22 + (seed % 5) * 0.025))
    out = ImageEnhance.Contrast(out).enhance(0.96)
    out = jpeg_roundtrip(out, quality=quality)
    return out


def fold_effect(img: Image.Image, seed: int = 0, vertical: bool = True, strength: float = 0.55) -> Image.Image:
    rng = np.random.default_rng(seed)
    arr = _to_np(img).astype(np.float32)
    h, w = arr.shape[:2]
    if vertical:
        x0 = int(w * rng.uniform(0.43, 0.58))
        dist = np.abs(np.arange(w) - x0).astype(np.float32)
        shadow = -42 * np.exp(-(dist ** 2) / (2 * (7 + 8 * strength) ** 2))
        highlight = 20 * np.exp(-((dist - 14) ** 2) / (2 * (15 + 5 * strength) ** 2))
        profile = (shadow + highlight) * strength
        arr += profile[None, :, None]
        # Fine crease line.
        x1 = max(0, x0 - 1); x2 = min(w, x0 + 2)
        arr[:, x1:x2, :] *= 0.88
    else:
        y0 = int(h * rng.uniform(0.40, 0.60))
        dist = np.abs(np.arange(h) - y0).astype(np.float32)
        profile = (-42 * np.exp(-(dist ** 2) / (2 * (7 + 8 * strength) ** 2)) + 20 * np.exp(-((dist - 14) ** 2) / (2 * (15 + 5 * strength) ** 2))) * strength
        arr += profile[:, None, None]
        arr[max(0,y0-1):min(h,y0+2), :, :] *= 0.88
    return jpeg_roundtrip(_to_img(arr), quality=76)


def crumple_effect(img: Image.Image, seed: int = 0, strength: float = 0.45) -> Image.Image:
    rng = np.random.default_rng(seed)
    arr = _to_np(img).astype(np.float32)
    h, w = arr.shape[:2]
    # Smooth wrinkle intensity map.
    wrinkle = rng.normal(0, 1, (max(4, h // 48), max(4, w // 48))).astype(np.float32)
    wrinkle = cv2.resize(wrinkle, (w, h), interpolation=cv2.INTER_CUBIC)
    wrinkle = cv2.GaussianBlur(wrinkle, (0, 0), 10)
    arr += wrinkle[:, :, None] * (8 * strength)
    # A few diagonal crease lines.
    overlay = np.zeros((h, w), dtype=np.float32)
    for _ in range(10):
        x1 = int(rng.integers(-w//4, w))
        y1 = int(rng.integers(0, h))
        x2 = int(x1 + rng.integers(w//4, w))
        y2 = int(y1 + rng.integers(-h//3, h//3))
        val = float(rng.choice([-1, 1]) * rng.uniform(16, 34) * strength)
        cv2.line(overlay, (x1, y1), (x2, y2), val, thickness=int(rng.integers(1, 3)))
    overlay = cv2.GaussianBlur(overlay, (0,0), 2.2)
    arr += overlay[:, :, None]
    out = _to_img(arr)
    return jpeg_roundtrip(out, quality=74)


def slight_torn_edge(img: Image.Image, seed: int = 0, side: str = "right", max_depth: int = 34) -> Image.Image:
    """Apply a margin-only edge tear. It should not occlude content if the document has adequate margins."""
    rng = np.random.default_rng(seed)
    arr = _to_np(img).astype(np.float32)
    h, w = arr.shape[:2]
    bg = np.array([232, 231, 226], dtype=np.float32)
    if side in {"right", "left"}:
        n = h
        small = rng.normal(0, 1, max(8, n // 64)).astype(np.float32)
        curve = cv2.resize(small.reshape(-1,1), (1, n), interpolation=cv2.INTER_CUBIC).reshape(-1)
        curve = (curve - curve.min()) / (curve.max() - curve.min() + 1e-6)
        depth = (6 + curve * max_depth).astype(np.int32)
        for y, d in enumerate(depth):
            if side == "right":
                arr[y, w-d:, :] = bg + rng.normal(0, 3, (d, 3))
            else:
                arr[y, :d, :] = bg + rng.normal(0, 3, (d, 3))
    else:
        n = w
        small = rng.normal(0, 1, max(8, n // 64)).astype(np.float32)
        curve = cv2.resize(small.reshape(1,-1), (n, 1), interpolation=cv2.INTER_CUBIC).reshape(-1)
        curve = (curve - curve.min()) / (curve.max() - curve.min() + 1e-6)
        depth = (6 + curve * max_depth).astype(np.int32)
        for x, d in enumerate(depth):
            if side == "bottom":
                arr[h-d:, x, :] = bg + rng.normal(0, 3, (d, 3))
            else:
                arr[:d, x, :] = bg + rng.normal(0, 3, (d, 3))
    return jpeg_roundtrip(_to_img(arr), quality=75)


def mobile_capture_effect(img: Image.Image, seed: int = 0) -> Image.Image:
    """Create a mobile-claim-app-like capture with perspective, desk background, shadow. Bboxes are not preserved."""
    rng = np.random.default_rng(seed)
    arr = _to_np(img)
    h, w = arr.shape[:2]
    pad = int(min(w, h) * 0.12)
    canvas_h = h + pad * 2
    canvas_w = w + pad * 2
    # Grey desk with slight noise.
    bg = np.full((canvas_h, canvas_w, 3), 223, dtype=np.float32)
    noise = rng.normal(0, 4, bg.shape[:2])
    bg += noise[:, :, None]
    src = np.float32([[0, 0], [w-1, 0], [w-1, h-1], [0, h-1]])
    jitter = int(pad * 0.55)
    dst = np.float32([
        [pad + rng.integers(-jitter, jitter//2), pad + rng.integers(-jitter//2, jitter)],
        [pad + w + rng.integers(-jitter//2, jitter), pad + rng.integers(-jitter, jitter//2)],
        [pad + w + rng.integers(-jitter, jitter//2), pad + h + rng.integers(-jitter//2, jitter)],
        [pad + rng.integers(-jitter//2, jitter), pad + h + rng.integers(-jitter, jitter//2)],
    ])
    M = cv2.getPerspectiveTransform(src, dst)
    warped = cv2.warpPerspective(arr, M, (canvas_w, canvas_h), borderMode=cv2.BORDER_CONSTANT, borderValue=(0,0,0))
    mask = cv2.warpPerspective(np.full((h, w), 255, np.uint8), M, (canvas_w, canvas_h), borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    # Shadow offset.
    sh = cv2.GaussianBlur(mask, (0,0), 18).astype(np.float32) / 255.0
    bg -= sh[:, :, None] * 22
    out = bg
    alpha = (mask.astype(np.float32) / 255.0)[:, :, None]
    out = out * (1 - alpha) + warped.astype(np.float32) * alpha
    out = np.clip(out, 0, 255).astype(np.uint8)
    pil = Image.fromarray(out, "RGB").filter(ImageFilter.GaussianBlur(radius=0.35))
    pil = ImageEnhance.Contrast(pil).enhance(0.97)
    return jpeg_roundtrip(pil, quality=70)
