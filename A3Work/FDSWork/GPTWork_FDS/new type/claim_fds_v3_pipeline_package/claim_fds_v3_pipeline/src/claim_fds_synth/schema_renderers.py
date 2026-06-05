from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw

from .layout import LayoutAudit, draw_grid, draw_text_box, font


@dataclass
class SimpleRenderedDocument:
    """간단한 v4 schema renderer 결과.

    이 renderer는 v4 고충실도 factory의 첫 GREEN 단계입니다. 실제 기관/환자 값을
    쓰지 않고 synthetic schema 값만 렌더링하며, 모든 핵심 field bbox를 manifest/QC가
    추적할 수 있게 반환합니다. 향후 실제 고충실 렌더러에서는 이 API를 유지한 채
    표 topology, 공식 PDF alignment, multi-page pagination을 확장하면 됩니다.
    """

    document_type: str
    image: Image.Image
    field_bboxes: list[dict[str, Any]]
    layout_audit: LayoutAudit


def _draw_header(draw: ImageDraw.ImageDraw, audit: LayoutAudit, title: str, provider: str, patient: str, font_path: str) -> None:
    draw_text_box(draw, audit, (70, 40, 760, 82), "SAFE SYNTHETIC TRAINING SAMPLE - NON SUBMITTABLE", font_path, 16, 10, align="left", label="safe_notice")
    draw_text_box(draw, audit, (70, 88, 760, 138), title, font_path, 26, 16, label="title")
    draw_text_box(draw, audit, (70, 150, 260, 188), "수진자", font_path, 17, 10, label="patient_label")
    draw_text_box(draw, audit, (260, 150, 460, 188), patient, font_path, 17, 10, label="patient_name")
    draw_text_box(draw, audit, (460, 150, 610, 188), "요양기관", font_path, 17, 10, label="provider_label")
    draw_text_box(draw, audit, (610, 150, 900, 188), provider, font_path, 17, 10, label="provider_name")


def render_pharmacy_receipt(data: dict[str, Any], style: dict[str, Any]) -> SimpleRenderedDocument:
    return _render_tabular_document("pharmacy_receipt", "약제비 계산서ㆍ영수증", data, style, ["dispense_date", "drug_total", "patient_burden_total", "paid_total"])


def render_prescription(data: dict[str, Any], style: dict[str, Any]) -> SimpleRenderedDocument:
    return _render_tabular_document("prescription", "처방전", data, style, ["prescription_date", "drug_name", "dosage_days", "provider_name"])


def _render_tabular_document(document_type: str, title: str, data: dict[str, Any], style: dict[str, Any], critical_fields: list[str]) -> SimpleRenderedDocument:
    page_w, page_h = 1000, 1400
    bg = tuple(style.get("paper_rgb", (248, 247, 241)))
    grid = tuple(style.get("grid_rgb", (88, 125, 170)))
    image = Image.new("RGB", (page_w, page_h), bg)
    draw = ImageDraw.Draw(image)
    audit = LayoutAudit((0, 0, page_w, page_h))
    font_path = style.get("font_path", "C:/Windows/Fonts/NotoSansKR-VF.ttf")
    _ = font(font_path, 14)
    _draw_header(draw, audit, title, data["provider_name"], data["patient_name"], font_path)
    draw_grid(draw, audit, (70, 230, 1110, 734), [180, 260, 160, 220, 220], [42] * 12, outline=grid, label=f"{document_type}_grid")
    headers = ["일자", "항목", "수량/일수", "금액", "비고"]
    x = 70
    for width, header in zip([180, 260, 160, 220, 220], headers):
        draw_text_box(draw, audit, (x, 230, x + width, 272), header, font_path, 16, 10, label=f"{document_type}_{header}")
        x += width
    field_bboxes: list[dict[str, Any]] = []
    rows = data.get("drug_lines", [])[:8]
    for idx, row in enumerate(rows):
        y = 272 + idx * 42
        values = [row.get("date", data.get("dispense_date", "2026-06-03")), row["name"], str(row["days"]), f"{row['amount']:,}", "SYN"]
        x = 70
        for col, (width, value) in enumerate(zip([180, 260, 160, 220, 220], values)):
            align = "right" if col == 3 else "center"
            draw_text_box(draw, audit, (x, y, x + width, y + 42), value, font_path, 15, 9, align=align, label=f"{document_type}_row_{idx}_{col}")
            x += width
    summary_y = 860
    summary_fields = {
        "drug_total": data["drug_total"],
        "patient_burden_total": data["patient_burden_total"],
        "paid_total": data["paid_total"],
    }
    if document_type == "prescription":
        summary_fields = {
            "prescription_date": data["prescription_date"],
            "drug_name": rows[0]["name"],
            "dosage_days": rows[0]["days"],
            "provider_name": data["provider_name"],
        }
    for i, (field_name, value) in enumerate(summary_fields.items()):
        y = summary_y + i * 54
        label_box = (610, y, 760, y + 44)
        value_box = (760, y, 930, y + 44)
        draw_text_box(draw, audit, label_box, field_name, font_path, 14, 9, align="left", label=f"{document_type}_{field_name}_label")
        draw_text_box(draw, audit, value_box, f"{value:,}" if isinstance(value, int) else str(value), font_path, 15, 9, align="right", label=field_name)
        field_bboxes.append({"field": field_name, "bbox": list(value_box), "critical": field_name in critical_fields})
    draw_text_box(draw, audit, (70, 1285, 930, 1330), "비실제 합성 샘플 / invalid synthetic identifiers only", font_path, 13, 9, align="right", label="synthetic_footer")
    return SimpleRenderedDocument(document_type, image, field_bboxes, audit)
