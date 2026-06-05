from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from PIL import Image, ImageDraw

from .layout import LayoutAudit, draw_grid, draw_rect, draw_text_box, font


@dataclass
class SimpleRenderedDocument:
    """간단한 v4 schema renderer 결과.

    이 renderer는 실손보험 FDS 학습용 합성 문서를 안전하게 넓히기 위한 공통 API입니다.
    실제 병원/환자/계좌/사업자번호를 복제하지 않고, 가명/무효 synthetic 값만 렌더링합니다.
    모든 핵심 field bbox를 manifest에 남겨 OCR/KIE, cross-document consistency, 이미지 포렌식
    평가가 같은 좌표계를 공유할 수 있게 합니다.
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


def render_claim_application(data: dict[str, Any], style: dict[str, Any]) -> SimpleRenderedDocument:
    fields = [
        ("청구유형", "실손의료비"),
        ("피보험자", data["patient_name"]),
        ("청구금액", data["claimed_amount"]),
        ("수익자계좌", data["beneficiary_account_token"]),
        ("사고/진료일", data["treatment_date"]),
        ("청구사유", data["claim_reason"]),
    ]
    return _render_form_document("claim_application", "보험금 청구서", data, style, fields, ["claimed_amount", "patient_name", "treatment_date"])


def render_diagnosis_certificate(data: dict[str, Any], style: dict[str, Any]) -> SimpleRenderedDocument:
    fields = [
        ("환자명", data["patient_name"]),
        ("진단명", data["diagnosis_name"]),
        ("질병분류기호", data["disease_code"]),
        ("진료과", data["department"]),
        ("진단일", data["diagnosis_date"]),
        ("발급의", data["issuer_doctor"]),
    ]
    return _render_form_document("diagnosis_certificate", "진단서", data, style, fields, ["diagnosis_name", "disease_code", "diagnosis_date"])


def render_hospitalization_confirmation(data: dict[str, Any], style: dict[str, Any]) -> SimpleRenderedDocument:
    fields = [
        ("환자명", data["patient_name"]),
        ("입원일", data["admission_date"]),
        ("퇴원일", data["discharge_date"]),
        ("입원일수", data["admission_days"]),
        ("주상병", data["diagnosis_name"]),
        ("병동", data["ward_token"]),
    ]
    return _render_form_document("hospitalization_confirmation", "입퇴원 확인서", data, style, fields, ["admission_date", "discharge_date", "admission_days"])


def render_outpatient_confirmation(data: dict[str, Any], style: dict[str, Any]) -> SimpleRenderedDocument:
    fields = [
        ("환자명", data["patient_name"]),
        ("통원일자", data["treatment_date"]),
        ("진료과", data["department"]),
        ("진료내용", data["treatment_summary"]),
        ("진단명", data["diagnosis_name"]),
        ("발급번호", data["document_no"]),
    ]
    return _render_form_document("outpatient_confirmation", "통원 확인서", data, style, fields, ["treatment_date", "diagnosis_name", "document_no"])


def render_medical_opinion(data: dict[str, Any], style: dict[str, Any]) -> SimpleRenderedDocument:
    fields = [
        ("환자명", data["patient_name"]),
        ("소견", data["medical_opinion"]),
        ("질병분류기호", data["disease_code"]),
        ("향후치료", data["future_treatment"]),
        ("작성일", data["diagnosis_date"]),
        ("작성의", data["issuer_doctor"]),
    ]
    return _render_form_document("medical_opinion", "의사 소견서", data, style, fields, ["medical_opinion", "disease_code"])


def render_surgery_confirmation(data: dict[str, Any], style: dict[str, Any]) -> SimpleRenderedDocument:
    fields = [
        ("환자명", data["patient_name"]),
        ("수술명", data["surgery_name"]),
        ("수술일", data["surgery_date"]),
        ("마취구분", data["anesthesia_type"]),
        ("질병분류기호", data["disease_code"]),
        ("집도의", data["issuer_doctor"]),
    ]
    return _render_form_document("surgery_confirmation", "수술 확인서", data, style, fields, ["surgery_name", "surgery_date", "disease_code"])


def render_claim_review_cover_sheet(data: dict[str, Any], style: dict[str, Any]) -> SimpleRenderedDocument:
    fields = [
        ("심사접수번호", data["review_no"]),
        ("청구번호", data["claim_no"]),
        ("대표문서", data["primary_document"]),
        ("대표위험유형", data["risk_taxonomy"]),
        ("필수서류", data["required_documents"]),
        ("FDS사유코드", data["reason_codes"]),
    ]
    return _render_form_document("claim_review_cover_sheet", "손해보험 실손 FDS 심사 커버시트", data, style, fields, ["review_no", "risk_taxonomy", "reason_codes"])


def render_inpatient_detail_statement(data: dict[str, Any], style: dict[str, Any]) -> SimpleRenderedDocument:
    """입원 진료비 세부내역서.

    병실료, 식대, 처치/수술/마취, 비급여, 투약/검사 항목처럼 입원 청구에서
    과청구·항목추가·수량조작이 자주 문제되는 표 영역을 명시적으로 렌더링합니다.
    """

    return _render_inpatient_detail_document(
        "inpatient_detail_statement",
        "입원 진료비 세부내역서",
        data,
        style,
        ["admission_date", "discharge_date", "room_charge", "noncovered_amount", "inserted_line_item_amount", "surgery_anesthesia_amount"],
    )


def render_supporting_evidence_checklist(data: dict[str, Any], style: dict[str, Any]) -> SimpleRenderedDocument:
    fields = [
        ("진료비계산서", data["receipt_checkbox"]),
        ("진료비세부내역서", data["detail_checkbox"]),
        ("질병분류기호처방전", data["prescription_checkbox"]),
        ("약제비영수증", data["pharmacy_checkbox"]),
        ("진단서", data["diagnosis_checkbox"]),
        ("입퇴원확인서", data["hospitalization_checkbox"]),
        ("입원세부내역서", data["inpatient_detail_checkbox"]),
        ("누락/불일치메모", data["evidence_mismatch_note"]),
    ]
    return _render_checklist_document("supporting_evidence_checklist", "실손 청구 증빙자료 체크리스트", data, style, fields, ["hospitalization_checkbox", "inpatient_detail_checkbox", "evidence_mismatch_note"])


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
    draw_grid(draw, audit, (70, 230, 930, 734), [160, 260, 140, 190, 110], [42] * 12, outline=grid, label=f"{document_type}_grid")
    headers = ["일자", "항목", "수량/일수", "금액", "비고"]
    x = 70
    for width, header in zip([160, 260, 140, 190, 110], headers):
        draw_text_box(draw, audit, (x, 230, x + width, 272), header, font_path, 16, 10, label=f"{document_type}_{header}")
        x += width
    field_bboxes: list[dict[str, Any]] = []
    rows = data.get("drug_lines", [])[:8]
    for idx, row in enumerate(rows):
        y = 272 + idx * 42
        values = [row.get("date", data.get("dispense_date", "2026-06-03")), row["name"], str(row["days"]), f"{row['amount']:,}", "SYN"]
        x = 70
        for col, (width, value) in enumerate(zip([160, 260, 140, 190, 110], values)):
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


def _render_inpatient_detail_document(document_type: str, title: str, data: dict[str, Any], style: dict[str, Any], critical_fields: list[str]) -> SimpleRenderedDocument:
    page_w, page_h = 1200, 1500
    bg = tuple(style.get("paper_rgb", (248, 247, 241)))
    grid = tuple(style.get("grid_rgb", (88, 125, 170)))
    image = Image.new("RGB", (page_w, page_h), bg)
    draw = ImageDraw.Draw(image)
    audit = LayoutAudit((0, 0, page_w, page_h))
    font_path = style.get("font_path", "C:/Windows/Fonts/NotoSansKR-VF.ttf")
    _draw_header(draw, audit, title, data["provider_name"], data["patient_name"], font_path)
    draw_text_box(draw, audit, (70, 205, 250, 240), "입원기간", font_path, 15, 9, label="admission_period_label")
    draw_text_box(draw, audit, (250, 205, 530, 240), f"{data['admission_date']} ~ {data['discharge_date']}", font_path, 15, 9, label="admission_period")
    draw_text_box(draw, audit, (560, 205, 710, 240), "입원일수", font_path, 15, 9, label="admission_days_label")
    draw_text_box(draw, audit, (710, 205, 860, 240), str(data["admission_days"]), font_path, 15, 9, label="admission_days")
    table = (55, 270, 1145, 974)
    widths = [90, 205, 75, 110, 110, 110, 110, 110, 170]
    draw_grid(draw, audit, table, widths, [44] * 16, outline=grid, label="inpatient_detail_grid")
    headers = ["일자", "항목", "수량", "급여", "본인부담", "전액본인", "비급여", "선택", "비고"]
    x = table[0]
    for width, header in zip(widths, headers):
        draw_text_box(draw, audit, (x, 270, x + width, 314), header, font_path, 14, 8, label=f"inpatient_header_{header}")
        x += width
    field_bboxes: list[dict[str, Any]] = []
    for idx, row in enumerate(data["inpatient_lines"][:14]):
        y = 314 + idx * 44
        values = [row["date"], row["name"], str(row["qty"]), row["covered"], row["patient_burden"], row["full_patient"], row["noncovered"], row["selective"], row["note"]]
        x = table[0]
        for col, (width, value) in enumerate(zip(widths, values)):
            shown = f"{value:,}" if isinstance(value, int) else str(value)
            align = "right" if col >= 3 and col <= 7 else "center"
            draw_text_box(draw, audit, (x, y, x + width, y + 44), shown, font_path, 13, 7, align=align, label=f"inpatient_row_{idx}_{col}")
            x += width
    summary_fields = {
        "room_charge": data["room_charge"],
        "noncovered_amount": data["noncovered_amount"],
        "inserted_line_item_amount": data["inserted_line_item_amount"],
        "surgery_anesthesia_amount": data["surgery_anesthesia_amount"],
        "inpatient_total": data["inpatient_total"],
    }
    for idx, (field_name, value) in enumerate(summary_fields.items()):
        y = 1040 + idx * 50
        label_box = (610, y, 850, y + 42)
        value_box = (850, y, 1115, y + 42)
        draw_text_box(draw, audit, label_box, field_name, font_path, 14, 8, align="left", label=f"{field_name}_label")
        draw_text_box(draw, audit, value_box, f"{value:,}", font_path, 15, 8, align="right", label=field_name)
        field_bboxes.append({"field": field_name, "bbox": list(value_box), "critical": field_name in critical_fields})
    draw_text_box(draw, audit, (70, 1370, 1130, 1410), "비실제 합성 입원 세부내역 / 항목추가·수량조작 FDS 학습용", font_path, 14, 8, align="right", label="synthetic_footer")
    return SimpleRenderedDocument(document_type, image, field_bboxes, audit)


def _render_checklist_document(document_type: str, title: str, data: dict[str, Any], style: dict[str, Any], fields: list[tuple[str, Any]], critical_fields: list[str]) -> SimpleRenderedDocument:
    page_w, page_h = 1000, 1400
    bg = tuple(style.get("paper_rgb", (248, 247, 241)))
    grid = tuple(style.get("grid_rgb", (88, 125, 170)))
    image = Image.new("RGB", (page_w, page_h), bg)
    draw = ImageDraw.Draw(image)
    audit = LayoutAudit((0, 0, page_w, page_h))
    font_path = style.get("font_path", "C:/Windows/Fonts/NotoSansKR-VF.ttf")
    _draw_header(draw, audit, title, data["provider_name"], data["patient_name"], font_path)
    field_bboxes: list[dict[str, Any]] = []
    draw_grid(draw, audit, (85, 245, 915, 805), [95, 445, 290], [56] * 10, outline=grid, label="supporting_checklist_grid")
    draw_text_box(draw, audit, (85, 245, 180, 301), "체크", font_path, 15, 8, label="check_header")
    draw_text_box(draw, audit, (180, 245, 625, 301), "증빙자료", font_path, 15, 8, label="evidence_header")
    draw_text_box(draw, audit, (625, 245, 915, 301), "FDS 검토 포인트", font_path, 15, 8, label="fds_header")
    for idx, (label, value) in enumerate(fields[:8]):
        y = 301 + idx * 56
        field_name = _field_name_from_label(label)
        checked = "☑" if str(value).upper() in {"Y", "TRUE", "CHECKED", "필수"} else "☐"
        draw_text_box(draw, audit, (85, y, 180, y + 56), checked, font_path, 22, 10, label=f"{field_name}_checkbox")
        draw_text_box(draw, audit, (180, y, 625, y + 56), label, font_path, 16, 9, align="left", label=f"{field_name}_label")
        draw_text_box(draw, audit, (625, y, 915, y + 56), str(value), font_path, 13, 7, align="left", label=field_name)
        field_bboxes.append({"field": field_name, "bbox": [85, y, 915, y + 56], "critical": field_name in critical_fields})
    draw_text_box(draw, audit, (85, 925, 915, 1015), "체크박스가 제출 문서와 맞지 않거나 필수 입원 증빙이 누락되면 문서 간 정합성 FDS 검토 대상입니다.", font_path, 16, 8, align="left", label="checklist_note")
    draw_text_box(draw, audit, (70, 1285, 930, 1330), "비실제 합성 체크리스트 / invalid synthetic evidence only", font_path, 13, 9, align="right", label="synthetic_footer")
    return SimpleRenderedDocument(document_type, image, field_bboxes, audit)


def _render_form_document(document_type: str, title: str, data: dict[str, Any], style: dict[str, Any], fields: list[tuple[str, Any]], critical_fields: list[str]) -> SimpleRenderedDocument:
    page_w, page_h = 1000, 1400
    bg = tuple(style.get("paper_rgb", (248, 247, 241)))
    grid = tuple(style.get("grid_rgb", (88, 125, 170)))
    image = Image.new("RGB", (page_w, page_h), bg)
    draw = ImageDraw.Draw(image)
    audit = LayoutAudit((0, 0, page_w, page_h))
    font_path = style.get("font_path", "C:/Windows/Fonts/NotoSansKR-VF.ttf")
    _ = font(font_path, 14)
    _draw_header(draw, audit, title, data["provider_name"], data["patient_name"], font_path)
    draw_grid(draw, audit, (70, 230, 930, 770), [210, 650], [54] * 10, outline=grid, label=f"{document_type}_form_grid")
    field_bboxes: list[dict[str, Any]] = []
    for idx, (label, value) in enumerate(fields[:9]):
        y = 230 + idx * 54
        label_box = (70, y, 280, y + 54)
        value_box = (280, y, 930, y + 54)
        field_name = _field_name_from_label(label)
        draw_text_box(draw, audit, label_box, str(label), font_path, 16, 10, align="left", label=f"{document_type}_{field_name}_label")
        align = "right" if isinstance(value, int) or "금액" in label else "left"
        shown = f"{value:,}" if isinstance(value, int) else str(value)
        draw_text_box(draw, audit, value_box, shown, font_path, 17, 9, align=align, label=field_name)
        field_bboxes.append({"field": field_name, "bbox": list(value_box), "critical": field_name in critical_fields})
    draw_rect(draw, audit, (690, 875, 875, 1015), outline=(178, 50, 50), width=3, label="synthetic_seal_box")
    draw_text_box(draw, audit, (710, 910, 855, 970), "합성\n전용", font_path, 20, 12, fill=(178, 50, 50), label="synthetic_seal")
    draw_text_box(draw, audit, (70, 1115, 930, 1160), "실제 제출 불가 / SAFE SYNTHETIC FDS TRAINING DATA", font_path, 16, 10, align="center", label="non_submittable_notice")
    draw_text_box(draw, audit, (70, 1285, 930, 1330), "모든 식별자는 비유효 가명값입니다", font_path, 13, 9, align="right", label="synthetic_footer")
    return SimpleRenderedDocument(document_type, image, field_bboxes, audit)


def _field_name_from_label(label: str) -> str:
    mapping = {
        "청구유형": "claim_type",
        "피보험자": "patient_name",
        "청구금액": "claimed_amount",
        "수익자계좌": "beneficiary_account_token",
        "사고/진료일": "treatment_date",
        "청구사유": "claim_reason",
        "환자명": "patient_name",
        "진단명": "diagnosis_name",
        "질병분류기호": "disease_code",
        "진료과": "department",
        "진단일": "diagnosis_date",
        "발급의": "issuer_doctor",
        "입원일": "admission_date",
        "퇴원일": "discharge_date",
        "입원일수": "admission_days",
        "주상병": "diagnosis_name",
        "병동": "ward_token",
        "통원일자": "treatment_date",
        "진료내용": "treatment_summary",
        "발급번호": "document_no",
        "소견": "medical_opinion",
        "향후치료": "future_treatment",
        "작성일": "diagnosis_date",
        "작성의": "issuer_doctor",
        "수술명": "surgery_name",
        "수술일": "surgery_date",
        "마취구분": "anesthesia_type",
        "집도의": "issuer_doctor",
        "심사접수번호": "review_no",
        "청구번호": "claim_no",
        "대표문서": "primary_document",
        "대표위험유형": "risk_taxonomy",
        "필수서류": "required_documents",
        "FDS사유코드": "reason_codes",
        "진료비계산서": "receipt_checkbox",
        "진료비세부내역서": "detail_checkbox",
        "질병분류기호처방전": "prescription_checkbox",
        "약제비영수증": "pharmacy_checkbox",
        "진단서": "diagnosis_checkbox",
        "입퇴원확인서": "hospitalization_checkbox",
        "입원세부내역서": "inpatient_detail_checkbox",
        "누락/불일치메모": "evidence_mismatch_note",
    }
    return mapping.get(label, label)
