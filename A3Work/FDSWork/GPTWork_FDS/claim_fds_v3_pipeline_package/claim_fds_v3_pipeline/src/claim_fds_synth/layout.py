from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Sequence, Tuple
from PIL import Image, ImageDraw, ImageFont

Box = Tuple[int, int, int, int]


@dataclass
class DrawRecord:
    kind: str
    label: str
    box: Box
    text: str = ""
    fitted_font_size: Optional[int] = None
    truncated: bool = False
    overflow: bool = False


@dataclass
class LayoutAudit:
    page_box: Box
    records: List[DrawRecord] = field(default_factory=list)

    def add(self, rec: DrawRecord) -> None:
        self.records.append(rec)

    def overflow_records(self) -> List[DrawRecord]:
        px1, py1, px2, py2 = self.page_box
        bad: List[DrawRecord] = []
        for r in self.records:
            x1, y1, x2, y2 = r.box
            if x1 < px1 or y1 < py1 or x2 > px2 or y2 > py2 or r.overflow:
                bad.append(r)
        return bad

    def truncated_records(self) -> List[DrawRecord]:
        return [r for r in self.records if r.truncated]

    def as_dict(self) -> dict:
        return {
            "page_box": self.page_box,
            "record_count": len(self.records),
            "overflow_count": len(self.overflow_records()),
            "truncated_count": len(self.truncated_records()),
            "overflows": [r.__dict__ for r in self.overflow_records()],
            "truncated": [r.__dict__ for r in self.truncated_records()],
        }


def _resolve_font_path(path: str) -> str:
    """Return a usable Korean-capable font path for cross-platform synthetic rendering.

    The v3 package was authored with Linux Nanum paths. In this Windows-hosted
    lab those paths may not exist, so we fall back to local Korean fonts while
    keeping the configured path authoritative when it is available.
    """

    requested = Path(path)
    if requested.exists():
        return str(requested)
    fallback_candidates = [
        Path("C:/Windows/Fonts/NotoSansKR-VF.ttf"),
        Path("C:/Windows/Fonts/malgun.ttf"),
        Path("C:/Windows/Fonts/gulim.ttc"),
        Path("/usr/share/fonts/truetype/nanum/NanumGothic.ttf"),
        Path("/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"),
    ]
    for candidate in fallback_candidates:
        if candidate.exists():
            return str(candidate)
    return path


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(_resolve_font_path(path), size)


def text_size(draw: ImageDraw.ImageDraw, text: str, fnt: ImageFont.ImageFont) -> Tuple[int, int]:
    if not text:
        return 0, 0
    bbox = draw.textbbox((0, 0), text, font=fnt)
    return bbox[2] - bbox[0], bbox[3] - bbox[1]


def shrink_or_truncate(
    draw: ImageDraw.ImageDraw,
    text: str,
    font_path: str,
    max_size: int,
    min_size: int,
    max_w: int,
    max_h: int,
    allow_truncate: bool = True,
) -> Tuple[str, ImageFont.FreeTypeFont, int, bool, bool]:
    """Return fitted text/font. overflow=False means it fits the box."""
    text = str(text)
    for size in range(max_size, min_size - 1, -1):
        fnt = font(font_path, size)
        w, h = text_size(draw, text, fnt)
        if w <= max_w and h <= max_h:
            return text, fnt, size, False, False
    fnt = font(font_path, min_size)
    if allow_truncate:
        ell = "…"
        t = text
        while t:
            candidate = t + ell
            w, h = text_size(draw, candidate, fnt)
            if w <= max_w and h <= max_h:
                return candidate, fnt, min_size, True, False
            t = t[:-1]
        return "", fnt, min_size, True, False
    return text, fnt, min_size, False, True


def draw_text_box(
    draw: ImageDraw.ImageDraw,
    audit: LayoutAudit,
    box: Box,
    text: str,
    font_path: str,
    max_size: int,
    min_size: int = 10,
    fill=(30, 30, 30),
    align: str = "center",
    valign: str = "middle",
    pad: int = 4,
    label: str = "text",
    allow_truncate: bool = True,
) -> DrawRecord:
    x1, y1, x2, y2 = map(int, box)
    max_w = max(1, x2 - x1 - 2 * pad)
    max_h = max(1, y2 - y1 - 2 * pad)
    fitted_text, fnt, fitted_size, truncated, overflow = shrink_or_truncate(
        draw, text, font_path, max_size, min_size, max_w, max_h, allow_truncate
    )
    tw, th = text_size(draw, fitted_text, fnt)
    if align == "left":
        tx = x1 + pad
    elif align == "right":
        tx = x2 - pad - tw
    else:
        tx = x1 + (x2 - x1 - tw) / 2
    if valign == "top":
        ty = y1 + pad
    elif valign == "bottom":
        ty = y2 - pad - th
    else:
        ty = y1 + (y2 - y1 - th) / 2 - 1
    draw.text((int(tx), int(ty)), fitted_text, font=fnt, fill=fill)
    rec = DrawRecord("text", label, (x1, y1, x2, y2), text, fitted_size, truncated, overflow)
    audit.add(rec)
    return rec


def draw_rect(
    draw: ImageDraw.ImageDraw,
    audit: LayoutAudit,
    box: Box,
    outline=(70, 70, 70),
    width: int = 1,
    fill=None,
    label: str = "rect",
) -> None:
    box = tuple(map(int, box))  # type: ignore[assignment]
    draw.rectangle(box, outline=outline, width=width, fill=fill)
    audit.add(DrawRecord("rect", label, box))


def split_by_sizes(start: int, sizes: Sequence[int]) -> List[Tuple[int, int]]:
    out = []
    pos = int(start)
    for s in sizes:
        out.append((pos, pos + int(s)))
        pos += int(s)
    return out


def proportional_sizes(total: int, weights: Sequence[float], min_each: int = 1) -> List[int]:
    if total < min_each * len(weights):
        raise ValueError("total is too small for requested minimum widths/heights")
    s = sum(weights)
    raw = [max(min_each, int(total * w / s)) for w in weights]
    delta = total - sum(raw)
    i = 0
    while delta != 0:
        j = i % len(raw)
        if delta > 0:
            raw[j] += 1
            delta -= 1
        elif raw[j] > min_each:
            raw[j] -= 1
            delta += 1
        i += 1
    return raw


def draw_grid(
    draw: ImageDraw.ImageDraw,
    audit: LayoutAudit,
    outer: Box,
    col_widths: Sequence[int],
    row_heights: Sequence[int],
    outline=(80, 80, 80),
    width: int = 1,
    label: str = "grid",
) -> List[List[Box]]:
    x1, y1, x2, y2 = map(int, outer)
    if sum(col_widths) != x2 - x1:
        raise ValueError(f"col_widths sum {sum(col_widths)} != box width {x2-x1}")
    if sum(row_heights) != y2 - y1:
        raise ValueError(f"row_heights sum {sum(row_heights)} != box height {y2-y1}")
    draw_rect(draw, audit, outer, outline=outline, width=width, label=label)
    x_edges = [x1]
    for w in col_widths:
        x_edges.append(x_edges[-1] + int(w))
    y_edges = [y1]
    for h in row_heights:
        y_edges.append(y_edges[-1] + int(h))
    for x in x_edges[1:-1]:
        draw.line([(x, y1), (x, y2)], fill=outline, width=width)
        audit.add(DrawRecord("line", f"{label}.vline", (x, y1, x, y2)))
    for y in y_edges[1:-1]:
        draw.line([(x1, y), (x2, y)], fill=outline, width=width)
        audit.add(DrawRecord("line", f"{label}.hline", (x1, y, x2, y)))
    cells: List[List[Box]] = []
    for ri in range(len(row_heights)):
        row = []
        for ci in range(len(col_widths)):
            row.append((x_edges[ci], y_edges[ri], x_edges[ci + 1], y_edges[ri + 1]))
        cells.append(row)
    return cells


def expand(box: Box, dx: int = 0, dy: int = 0) -> Box:
    x1, y1, x2, y2 = box
    return x1 - dx, y1 - dy, x2 + dx, y2 + dy


def inset(box: Box, dx: int = 0, dy: int = 0) -> Box:
    x1, y1, x2, y2 = box
    return x1 + dx, y1 + dy, x2 - dx, y2 - dy
