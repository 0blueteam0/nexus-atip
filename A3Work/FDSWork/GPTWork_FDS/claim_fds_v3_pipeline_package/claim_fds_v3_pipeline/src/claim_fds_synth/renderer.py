from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Tuple
from PIL import Image, ImageDraw
import random

from .claim_data import ClaimCase, CHARGE_ITEMS, won
from .layout import LayoutAudit, draw_grid, draw_rect, draw_text_box, proportional_sizes, inset

Box = Tuple[int, int, int, int]


@dataclass
class RenderResult:
    image: Image.Image
    audit: LayoutAudit
    field_bboxes: Dict[str, Box]


class Renderer:
    def __init__(self, config: dict):
        self.cfg = config
        self.W = int(config["page"]["width_px"])
        self.H = int(config["page"]["height_px"])
        self.M = int(config["page"]["margin_px"])
        self.font = config["fonts"]["primary"]
        self.bold = config["fonts"]["primary_bold"]
        self.mono = config["fonts"]["mono"]
        self.rng = random.Random(config.get("seed", 0))

    def _base_page(self) -> Tuple[Image.Image, ImageDraw.ImageDraw, LayoutAudit]:
        img = Image.new("RGB", (self.W, self.H), (250, 249, 244))
        draw = ImageDraw.Draw(img)
        audit = LayoutAudit((0, 0, self.W, self.H))
        # Paper boundary and slight scanned-paper tone.
        draw_rect(draw, audit, (self.M - 8, self.M - 8, self.W - self.M + 8, self.H - self.M + 8), outline=(222, 220, 213), width=1, fill=(252, 251, 247), label="paper_boundary")
        return img, draw, audit

    def render_medical_receipt(self, claim: ClaimCase, public_sample_mark: bool = True) -> RenderResult:
        img, draw, audit = self._base_page()
        fboxes: Dict[str, Box] = {}
        x0, y0 = self.M, self.M
        content_w = self.W - 2 * self.M
        right_x = self.W - self.M
        black = (28, 28, 28)
        line = (60, 60, 60)
        light = (244, 244, 240)

        # Small rule header.
        draw_text_box(draw, audit, (x0, y0 - 38, right_x, y0 - 6), "■ 국민건강보험 요양급여 기준 기반 합성 학습용 서식  <비실제기관>", self.font, 17, 10, fill=(65, 65, 65), align="left", label="basis_note")
        title = "[ ] 외래  [ ] 입원  ([ ] 퇴원  [ ] 중간)  진료비 계산서ㆍ영수증"
        draw_text_box(draw, audit, (x0, y0, right_x, y0 + 54), title, self.bold, 34, 18, fill=black, label="title")
        draw_text_box(draw, audit, (x0, y0 + 49, right_x, y0 + 74), "가상 문서번호: SYNTHETIC-TRAINING · 실제 제출 불가 · 모든 기관/번호는 무효값", self.font, 15, 9, fill=(95, 95, 95), label="safe_notice")

        # Header metadata grid.
        top_y = y0 + 88
        header_h = 156
        col_w = proportional_sizes(content_w, [1.08, 1.02, 1.12, 1.18], 120)
        row_h = [39, 39, 39, 39]
        cells = draw_grid(draw, audit, (x0, top_y, right_x, top_y + header_h), col_w, row_h, outline=line, width=1, label="patient_header_grid")
        meta = [
            ("환자등록번호", claim.patient_registration_no, "patient_registration_no"),
            ("환자 성명", claim.patient_name, "patient_name"),
            ("진료기간", f"{claim.treatment_start} 부터 {claim.treatment_end} 까지", "treatment_period"),
            ("야간(공휴일)진료", "[ ] 야간   [ ] 공휴일", "night_or_holiday_treatment"),
            ("진료과목", claim.department, "department"),
            ("질병군(DRG)번호", "-", "drg_no"),
            ("병실", "-", "ward"),
            ("환자구분", "건강보험 / 외래", "patient_category"),
            ("영수증번호(연월-일련번호)", claim.receipt_no, "receipt_no"),
            ("요양기관", claim.provider.name, "provider_name_header"),
            ("전화번호", claim.provider.phone, "provider_phone_header"),
            ("청구 구분", "실손 통원 참고용", "claim_context"),
        ]
        for i, (lab, val, key) in enumerate(meta):
            r = i // 4
            c = i % 4
            box = cells[r][c]
            mid = box[0] + int((box[2] - box[0]) * 0.43)
            draw_rect(draw, audit, (box[0], box[1], mid, box[3]), outline=(210, 210, 205), width=1, fill=(247, 247, 244), label=f"{key}.label_box")
            draw_text_box(draw, audit, (box[0], box[1], mid, box[3]), lab, self.bold, 16, 9, fill=black, label=f"{key}.label")
            draw_text_box(draw, audit, (mid, box[1], box[2], box[3]), val, self.font, 15, 9, fill=black, align="left", label=key)
            fboxes[key] = (mid, box[1], box[2], box[3])

        # Charge table + summary table.
        table_y = top_y + header_h + 24
        main_h = 1048
        left_w = int(content_w * 0.73)
        summary_w = content_w - left_w
        left_box = (x0, table_y, x0 + left_w, table_y + main_h)
        summary_box = (x0 + left_w, table_y, right_x, table_y + main_h)
        draw_text_box(draw, audit, (x0, table_y - 31, x0 + left_w, table_y - 5), "항목별 산정 내역", self.bold, 18, 10, align="left", label="section_charge_title")

        # Left charge grid.
        cols = proportional_sizes(left_w, [2.7, 1.28, 1.28, 1.18, 1.18, 1.85], 80)
        row_heights = [34, 34] + [30] * len(CHARGE_ITEMS) + [34, 46]
        assert sum(row_heights) == main_h, f"charge row height mismatch: {sum(row_heights)} vs {main_h}"
        charge_cells = draw_grid(draw, audit, left_box, cols, row_heights, outline=line, width=1, label="charge_grid")
        # Header row background.
        for ci in range(len(cols)):
            draw_rect(draw, audit, charge_cells[0][ci], outline=(95, 95, 95), fill=light, label="charge_header_fill0")
            draw_rect(draw, audit, charge_cells[1][ci], outline=(95, 95, 95), fill=light, label="charge_header_fill1")
        h0 = ["항목", "급여", "", "전액", "비급여", "금액산정내용"]
        h1 = ["", "일부 본인부담", "공단부담금", "본인부담", "", ""]
        for ci, txt in enumerate(h0):
            draw_text_box(draw, audit, charge_cells[0][ci], txt, self.bold, 15, 9, fill=black, label=f"charge_h0_{ci}")
        for ci, txt in enumerate(h1):
            draw_text_box(draw, audit, charge_cells[1][ci], txt, self.bold, 14, 8, fill=black, label=f"charge_h1_{ci}")
        for i, row in enumerate(claim.charge_rows):
            ri = i + 2
            vals = [
                row["label"],
                won(row["covered_partial_patient_payment"]) if row["covered_partial_patient_payment"] else "",
                won(row["covered_corporation_payment"]) if row["covered_corporation_payment"] else "",
                won(row["full_patient_payment"]) if row["full_patient_payment"] else "",
                won(row["noncovered_payment"]) if row["noncovered_payment"] else "",
                row["calculation_detail"],
            ]
            keys = [row["key"], f"{row['key']}.covered_partial", f"{row['key']}.corp", f"{row['key']}.full", f"{row['key']}.noncovered", f"{row['key']}.calc"]
            for ci, val in enumerate(vals):
                align = "left" if ci in [0, 5] else "right"
                pad = 7 if ci in [0, 5] else 8
                draw_text_box(draw, audit, charge_cells[ri][ci], val, self.mono if ci in [1, 2, 3, 4] else self.font, 14, 8, fill=black, align=align, pad=pad, label=keys[ci])
                if ci in [1, 2, 3, 4] and val:
                    fboxes[keys[ci]] = charge_cells[ri][ci]
        # Total row and cap-excess row.
        total_ri = 2 + len(CHARGE_ITEMS)
        for ci in range(len(cols)):
            draw_rect(draw, audit, charge_cells[total_ri][ci], outline=(95, 95, 95), fill=(241, 241, 237), label="charge_total_fill")
        totals = ["합계", won(claim.summary["covered_partial_patient_total"]), won(claim.summary["covered_corporation_total"]), won(claim.summary["full_patient_total"]), won(claim.summary["noncovered_total"]), "① ② ③ ④"]
        total_keys = ["charge_total_label", "covered_partial_patient_total", "covered_corporation_total", "full_patient_total", "noncovered_total", "charge_total_formula"]
        for ci, val in enumerate(totals):
            draw_text_box(draw, audit, charge_cells[total_ri][ci], val, self.bold if ci == 0 else self.mono, 15, 8, align="right" if ci in [1,2,3,4] else "center", pad=8, label=total_keys[ci])
            fboxes[total_keys[ci]] = charge_cells[total_ri][ci]
        cap_ri = total_ri + 1
        cap_vals = ["상한액 초과금", won(claim.summary["cap_excess"]), "-", "", "", "⑤"]
        for ci, val in enumerate(cap_vals):
            draw_text_box(draw, audit, charge_cells[cap_ri][ci], val, self.font, 13, 8, align="right" if ci in [1,2,3,4] else "center", label=f"cap_excess_{ci}")
            if ci == 1:
                fboxes["cap_excess"] = charge_cells[cap_ri][ci]

        # Summary table.
        sum_rows = [80, 80, 80, 64, 64, 58, 58, 58, 58, 64, 56, 56, 56, 216]
        assert sum(sum_rows) == main_h, f"summary row height mismatch {sum(sum_rows)} vs {main_h}"
        sum_cells = draw_grid(draw, audit, summary_box, [int(summary_w * 0.52), summary_w - int(summary_w * 0.52)], sum_rows, outline=line, width=1, label="summary_grid")
        summary_entries = [
            ("⑥ 진료비 총액\n(①+②+③+④)", "total_medical_fee", won(claim.summary["total_medical_fee"])),
            ("⑦ 공단부담 총액\n(②+⑤)", "insurer_corporation_total", won(claim.summary["insurer_corporation_total"])),
            ("⑧ 환자부담 총액\n(①-⑤)+③+④", "patient_burden_total", won(claim.summary["patient_burden_total"])),
            ("⑨ 이미 납부한 금액", "prepaid_amount", won(claim.summary["prepaid_amount"])),
            ("⑩ 납부할 금액\n(⑧-⑨)", "amount_due", won(claim.summary["amount_due"])),
            ("⑪ 납부한 금액 / 카드", "paid_by_card", won(claim.summary["paid_by_card"])),
            ("현금영수증", "paid_by_cash_receipt", won(claim.summary["paid_by_cash_receipt"])),
            ("현금", "paid_by_cash", won(claim.summary["paid_by_cash"])),
            ("합계", "paid_total", won(claim.summary["paid_total"])),
            ("납부하지 않은 금액\n(⑩-⑪)", "unpaid_amount", won(claim.summary["unpaid_amount"])),
            ("현금영수증( )", "cash_receipt_marker", ""),
            ("신분확인번호", "cash_receipt_identity_no", "SYNTH-ID"),
            ("현금영수증 승인번호", "cash_receipt_approval_no", "SYN-APPROVAL"),
        ]
        for ri, (lab, key, val) in enumerate(summary_entries):
            if ri < 5:
                draw_rect(draw, audit, sum_cells[ri][0], outline=(95,95,95), fill=(245,245,241), label=f"summary_{key}_label_fill")
            draw_text_box(draw, audit, sum_cells[ri][0], lab, self.bold if ri < 5 else self.font, 14, 8, fill=black, label=f"summary.{key}.label")
            align = "right" if val and any(ch.isdigit() for ch in val) else "center"
            draw_text_box(draw, audit, sum_cells[ri][1], val, self.mono, 16 if ri < 5 else 13, 8, fill=black, align=align, pad=10, label=f"summary.{key}.value")
            fboxes[key] = sum_cells[ri][1]
        draw_text_box(draw, audit, sum_cells[13][0], "* 요양기관 임의활용공간", self.font, 14, 8, align="left", valign="top", pad=10, fill=black, label="provider_optional_area_label")
        draw_text_box(draw, audit, sum_cells[13][1], "교육용 합성 출력\n실제 청구 불가", self.font, 14, 8, fill=(100, 100, 100), label="provider_optional_area_value")

        # Provider section.
        prov_y = table_y + main_h + 18
        prov_h = 160
        prov_cols = proportional_sizes(content_w, [1.2, 2.2, 1.0, 1.25, 1.2, 1.1], 100)
        prov_rows = [40, 40, 40, 40]
        prov = draw_grid(draw, audit, (x0, prov_y, right_x, prov_y + prov_h), prov_cols, prov_rows, outline=line, width=1, label="provider_grid")
        provider_fields = [
            (0, 0, "요양기관 종류", "provider_type", f"[ ] 의원급ㆍ보건기관   [ ] 병원급   [ ] 종합병원   [ ] 상급종합병원"),
            (1, 0, "사업자등록번호", "provider_business_no", claim.provider.business_no),
            (1, 2, "상호", "provider_name", claim.provider.name),
            (1, 4, "전화번호", "provider_phone", claim.provider.phone),
            (2, 0, "사업장 소재지", "provider_address", claim.provider.address),
            (2, 4, "대표자", "provider_representative", claim.provider.representative + "  [인]"),
            (3, 0, "발행일", "issue_date", claim.issue_date),
        ]
        # Manually merged-ish boxes by writing across several cells.
        def cell_span(row, c1, c2):
            return (prov[row][c1][0], prov[row][c1][1], prov[row][c2][2], prov[row][c2][3])
        spans = {
            "provider_type": cell_span(0, 1, 5),
            "provider_business_no": prov[1][1],
            "provider_name": prov[1][3],
            "provider_phone": prov[1][5],
            "provider_address": cell_span(2, 1, 3),
            "provider_representative": prov[2][5],
            "issue_date": cell_span(3, 1, 5),
        }
        label_boxes = {
            "provider_type": prov[0][0], "provider_business_no": prov[1][0], "provider_name": prov[1][2], "provider_phone": prov[1][4],
            "provider_address": prov[2][0], "provider_representative": prov[2][4], "issue_date": prov[3][0]
        }
        values = {
            "provider_type": f"[x] {claim.provider.provider_type}   [ ] 병원급   [ ] 종합병원   [ ] 상급종합병원",
            "provider_business_no": claim.provider.business_no,
            "provider_name": claim.provider.name,
            "provider_phone": claim.provider.phone,
            "provider_address": claim.provider.address,
            "provider_representative": claim.provider.representative + "  [인]",
            "issue_date": claim.issue_date,
        }
        labels = {"provider_type":"요양기관 종류","provider_business_no":"사업자등록번호","provider_name":"상호","provider_phone":"전화번호","provider_address":"사업장 소재지","provider_representative":"대표자","issue_date":"년      월      일"}
        for key in labels:
            draw_text_box(draw, audit, label_boxes[key], labels[key], self.bold, 14, 8, fill=black, label=f"{key}.label")
            draw_text_box(draw, audit, spans[key], values[key], self.font, 14, 8, fill=black, align="left", pad=9, label=key)
            fboxes[key] = spans[key]
        # Fake seal circle, not a real provider mark.
        sx1, sy1, sx2, sy2 = inset(spans["provider_representative"], 10, 6)
        cx, cy = sx2 - 36, (sy1 + sy2) // 2
        draw.ellipse((cx - 24, cy - 24, cx + 24, cy + 24), outline=(150, 45, 45), width=2)
        draw_text_box(draw, audit, (cx-20, cy-12, cx+20, cy+12), "합성", self.bold, 13, 8, fill=(150,45,45), label="synthetic_seal")

        # Notes section: compact, no overflow.
        notes_y = prov_y + prov_h + 20
        notes_h = self.H - self.M - notes_y - 36
        note_cols = proportional_sizes(content_w, [1.6, 1.0], 200)
        note_cells = draw_grid(draw, audit, (x0, notes_y, right_x, notes_y + notes_h), note_cols, [notes_h], outline=line, width=1, label="notes_grid")
        note_left = (
            "항목별 설명\n"
            "1. 일부 본인부담: 요양기관 종별, 환자 자격, 선별급여 여부 등에 따라 달라질 수 있습니다.\n"
            "2. 전액 본인부담: 건강보험에서 금액을 정하나 환자 본인이 전액 부담하는 항목입니다.\n"
            "3. 상한액 초과금: 본인부담상한제 관련 사전 정산 금액입니다.\n"
            "4. 진료항목 중 선택항목은 요양기관 특성에 따라 추가 또는 생략될 수 있습니다."
        )
        note_right = (
            "일반사항 안내\n"
            "1. 세부내역은 요양기관에 요구하여 제공받을 수 있습니다.\n"
            "2. 비급여 비용 타당성은 건강보험심사평가원에 확인 요청할 수 있습니다.\n"
            "3. 본 샘플은 FDS 방어 학습용 합성 데이터입니다."
        )
        draw_text_box(draw, audit, note_cells[0][0], note_left, self.font, 13, 8, fill=black, align="left", valign="top", pad=14, label="notes_left")
        draw_text_box(draw, audit, note_cells[0][1], note_right, self.font, 13, 8, fill=black, align="left", valign="top", pad=14, label="notes_right")
        footer = "210mm×297mm [백상지 80g/㎡] · SAFE SYNTHETIC SAMPLE"
        draw_text_box(draw, audit, (x0, self.H - self.M - 28, right_x, self.H - self.M - 4), footer, self.font, 12, 8, fill=(90,90,90), align="right", label="footer")

        if public_sample_mark:
            # Public preview-only mark. Disable for internal training, use manifest provenance instead.
            draw_text_box(draw, audit, (x0 + 10, self.H - self.M - 58, x0 + 430, self.H - self.M - 32), "비실제 교육용 샘플", self.bold, 16, 10, fill=(120, 120, 120), align="left", label="public_sample_mark")
        return RenderResult(img, audit, fboxes)

    def render_detail_statement(self, claim: ClaimCase, public_sample_mark: bool = True) -> RenderResult:
        img, draw, audit = self._base_page()
        fboxes: Dict[str, Box] = {}
        x0, y0 = self.M, self.M
        content_w = self.W - 2 * self.M
        right_x = self.W - self.M
        black = (28, 28, 28)
        line = (60, 60, 60)
        draw_text_box(draw, audit, (x0, y0 - 38, right_x, y0 - 8), "■ 진료비 세부산정내역 표준서식 기반 합성 학습용", self.font, 16, 9, fill=(65,65,65), align="left", label="detail_basis_note")
        draw_text_box(draw, audit, (x0, y0, right_x, y0 + 55), "진료비 세부산정내역", self.bold, 34, 18, fill=black, label="detail_title")
        draw_text_box(draw, audit, (x0, y0 + 52, right_x, y0 + 78), "가상 문서번호: SYNTHETIC-DETAIL · 실제 제출 불가", self.font, 15, 9, fill=(95,95,95), label="detail_safe_notice")
        header_y = y0 + 92
        header_h = 144
        hcols = proportional_sizes(content_w, [1.05,1.05,1.35,0.9,1.2], 100)
        hrows = [36,36,36,36]
        cells = draw_grid(draw, audit, (x0, header_y, right_x, header_y + header_h), hcols, hrows, outline=line, width=1, label="detail_header")
        meta = [
            ("환자등록번호", claim.patient_registration_no, "patient_registration_no"),
            ("환자성명", claim.patient_name, "patient_name"),
            ("진료기간", f"{claim.treatment_start} ~ {claim.treatment_end}", "treatment_period"),
            ("병실", "-", "ward"),
            ("환자구분", "건강보험/외래", "patient_category"),
            ("요양기관", claim.provider.name, "provider_name"),
            ("진료과목", claim.department, "department"),
            ("영수증번호", claim.receipt_no, "receipt_no"),
        ]
        for i, (lab,val,key) in enumerate(meta):
            r = i // 4
            c = i % 4
            box = cells[r][c]
            mid = box[0] + int((box[2]-box[0])*0.44)
            draw_rect(draw, audit, (box[0],box[1],mid,box[3]), outline=(210,210,205), fill=(247,247,244), label=f"detail.{key}.label_box")
            draw_text_box(draw, audit, (box[0],box[1],mid,box[3]), lab, self.bold, 14,8, fill=black, label=f"detail.{key}.label")
            draw_text_box(draw, audit, (mid,box[1],box[2],box[3]), val, self.font, 14,8, fill=black, align="left", pad=8, label=f"detail.{key}")
            fboxes[key] = (mid,box[1],box[2],box[3])
        # Main detailed line table.
        table_y = header_y + header_h + 26
        table_h = 1050
        columns = proportional_sizes(content_w, [0.75,0.85,1.0,2.1,0.55,0.85,1.0,1.0,0.9,0.9,0.95], 55)
        row_heights = [40, 34] + [52] * max(14, len(claim.detail_rows))
        # Keep deterministic row count and height within table_h.
        n_line_rows = 14
        row_heights = [40, 34] + [48] * n_line_rows
        table_h = sum(row_heights)
        line_cells = draw_grid(draw, audit, (x0, table_y, right_x, table_y + table_h), columns, row_heights, outline=line, width=1, label="detail_lines_grid")
        for ci in range(len(columns)):
            draw_rect(draw, audit, line_cells[0][ci], outline=(95,95,95), fill=(244,244,240), label="detail_header_fill0")
            draw_rect(draw, audit, line_cells[1][ci], outline=(95,95,95), fill=(244,244,240), label="detail_header_fill1")
        headers0 = ["일자", "항목", "코드", "명칭", "수량", "단가", "급여", "", "전액", "비급여", "합계"]
        headers1 = ["", "", "", "", "", "", "본인부담", "공단부담", "본인부담", "", ""]
        for ci,t in enumerate(headers0):
            draw_text_box(draw, audit, line_cells[0][ci], t, self.bold, 13, 7, fill=black, label=f"detail_header0_{ci}")
            draw_text_box(draw, audit, line_cells[1][ci], headers1[ci], self.bold, 12, 7, fill=black, label=f"detail_header1_{ci}")
        rows = claim.detail_rows[:n_line_rows]
        for i in range(n_line_rows):
            ri = i + 2
            if i < len(rows):
                r = rows[i]
                vals = [r["treatment_date"], r["category"], r["code"], r["name"], str(r["quantity"]), won(r["unit_price"]), won(r["covered_partial_patient_payment"]) if r["covered_partial_patient_payment"] else "", won(r["covered_corporation_payment"]) if r["covered_corporation_payment"] else "", won(r["full_patient_payment"]) if r["full_patient_payment"] else "", won(r["noncovered_payment"]) if r["noncovered_payment"] else "", won(r["total_amount"])]
            else:
                vals = [""] * 11
            for ci,val in enumerate(vals):
                align = "left" if ci in [1,3] else "right" if ci in [4,5,6,7,8,9,10] else "center"
                font_path = self.mono if ci in [4,5,6,7,8,9,10] else self.font
                draw_text_box(draw, audit, line_cells[ri][ci], val, font_path, 12, 7, fill=black, align=align, pad=6, label=f"detail.line{i}.{ci}")
        # Summary table.
        sum_y = table_y + table_h + 24
        sum_h = 176
        scol = proportional_sizes(content_w, [1.0,1.0,1.0,1.0,1.0], 100)
        srow = [42, 42, 46, 46]
        scells = draw_grid(draw, audit, (x0, sum_y, right_x, sum_y + sum_h), scol, srow, outline=line, width=1, label="detail_summary_grid")
        labels = ["일부 본인부담", "공단부담금", "전액 본인부담", "비급여", "총액"]
        vals = [claim.summary["covered_partial_patient_total"], claim.summary["covered_corporation_total"], claim.summary["full_patient_total"], claim.summary["noncovered_total"], claim.summary["total_medical_fee"]]
        keys = ["covered_partial_patient_total", "covered_corporation_total", "full_patient_total", "noncovered_total", "line_total"]
        for ci, lab in enumerate(labels):
            draw_rect(draw, audit, scells[0][ci], outline=(95,95,95), fill=(244,244,240), label="detail_summary_header_fill")
            draw_text_box(draw, audit, scells[0][ci], lab, self.bold, 14, 8, fill=black, label=f"detail_summary_{keys[ci]}_label")
            draw_text_box(draw, audit, scells[1][ci], won(vals[ci]), self.mono, 16, 8, fill=black, align="right", pad=10, label=f"detail_summary_{keys[ci]}")
            fboxes[f"detail_{keys[ci]}"] = scells[1][ci]
        note_y = sum_y + sum_h + 26
        note_h = self.H - self.M - note_y - 30
        note = (
            "안내: 본 세부산정내역은 합성 FDS 학습용 예시입니다. 환자 본인 외 발급 금지 문구와 진료비 계산서ㆍ영수증별 발행 원칙을 반영하되, "
            "실제 기관명ㆍ번호ㆍ환자정보는 사용하지 않습니다. 금액 합계는 진료비 계산서ㆍ영수증과 교차 검증됩니다."
        )
        draw_grid(draw, audit, (x0, note_y, right_x, note_y + note_h), [content_w], [note_h], outline=line, width=1, label="detail_notes_grid")
        draw_text_box(draw, audit, (x0, note_y, right_x, note_y + note_h), note, self.font, 14, 8, fill=black, align="left", valign="top", pad=16, label="detail_notes")
        draw_text_box(draw, audit, (x0, self.H - self.M - 28, right_x, self.H - self.M - 4), "210mm×297mm · SAFE SYNTHETIC DETAIL SAMPLE", self.font, 12, 8, fill=(90,90,90), align="right", label="detail_footer")
        if public_sample_mark:
            draw_text_box(draw, audit, (x0 + 10, self.H - self.M - 58, x0 + 450, self.H - self.M - 32), "비실제 교육용 샘플", self.bold, 16, 10, fill=(120,120,120), align="left", label="public_sample_mark")
        return RenderResult(img, audit, fboxes)
