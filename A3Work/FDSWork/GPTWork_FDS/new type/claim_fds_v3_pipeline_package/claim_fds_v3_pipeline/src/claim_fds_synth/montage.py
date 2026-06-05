from __future__ import annotations
from typing import List, Tuple
from PIL import Image, ImageDraw, ImageFont

from .layout import _resolve_font_path


def make_montage(items: List[Tuple[str, Image.Image]], out_path: str, thumb_w: int = 620) -> Image.Image:
    font_path = "/usr/share/fonts/truetype/nanum/NanumGothic.ttf"
    bold_path = "/usr/share/fonts/truetype/nanum/NanumGothicBold.ttf"
    f = ImageFont.truetype(_resolve_font_path(font_path), 18)
    b = ImageFont.truetype(_resolve_font_path(bold_path), 20)
    thumbs = []
    for title, img in items:
        im = img.convert("RGB")
        ratio = thumb_w / im.width
        th = int(im.height * ratio)
        im = im.resize((thumb_w, th), Image.Resampling.LANCZOS)
        thumbs.append((title, im))
    cols = 2
    pad = 28
    label_h = 42
    cell_w = thumb_w
    cell_h = max(im.height for _, im in thumbs) + label_h
    rows = (len(thumbs) + cols - 1) // cols
    canvas = Image.new("RGB", (cols*cell_w + (cols+1)*pad, rows*cell_h + (rows+1)*pad), (238,238,236))
    d = ImageDraw.Draw(canvas)
    for idx, (title, im) in enumerate(thumbs):
        r = idx // cols; c = idx % cols
        x = pad + c*(cell_w+pad); y = pad + r*(cell_h+pad)
        d.text((x, y), title, font=b, fill=(30,30,30))
        canvas.paste(im, (x, y+label_h))
    canvas.save(out_path)
    return canvas
