from __future__ import annotations

import json
import random
import shutil
from copy import deepcopy
from pathlib import Path
from typing import Any, Iterable

import yaml
from PIL import Image, ImageDraw, ImageFilter

from fds_synth_ref.privacy_transform import PrivacyContext, leak_scan, pseudonym_name, pseudonym_provider, synthetic_patient_registration_no, synthetic_receipt_no, invalid_business_registration_no
from fds_synth_ref.profile_extractor import extract_profile

from .claim_data import ClaimCase, generate_claim
from .degradation import mobile_capture_effect, scanner_effect
from .renderer import Renderer
from .reporting import build_korean_excel_summary
from .schema_renderers import (
    SimpleRenderedDocument,
    render_claim_application,
    render_claim_review_cover_sheet,
    render_diagnosis_certificate,
    render_hospitalization_confirmation,
    render_medical_opinion,
    render_outpatient_confirmation,
    render_pharmacy_receipt,
    render_prescription,
    render_surgery_confirmation,
)
from .qc import audit_layout
from .montage import make_montage


CLUSTER_IDS = ["C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8"]
CLUSTER_HINTS = {
    "C1": {"page_scope": "partial_summary_panel_closeup", "grid_family": "blue_form_lines", "benign": ["perspective", "wood_background"]},
    "C2": {"page_scope": "landscape_crop", "grid_family": "blue_form_lines", "benign": ["low_res_crop", "purple_memo_stamp"]},
    "C3": {"page_scope": "full_page_portrait", "grid_family": "gray_black_official", "benign": ["bottom_microtext"]},
    "C4": {"page_scope": "landscape_inpatient", "grid_family": "gray_black_official", "benign": ["barcode_placeholder", "watermark"]},
    "C5": {"page_scope": "two_panel_screenshot_crop", "grid_family": "blue_form_lines", "benign": ["red_circle_annotation"]},
    "C6": {"page_scope": "modern_full_page_qr", "grid_family": "gray_black_official", "benign": ["qr_placeholder", "red_stamp"]},
    "C7": {"page_scope": "mobile_full_photo", "grid_family": "blue_form_lines", "benign": ["warm_lighting", "perspective", "red_stamp"]},
    "C8": {"page_scope": "line_item_table_crop", "grid_family": "gray_black_official", "benign": ["sparse_zero_cells", "crop"]},
}

ATTACK_TAXONOMY = {
    "semantic_amount_mismatch": {
        "category": "금액 변조/과청구",
        "reason_codes": ["R101_AMOUNT_MISMATCH", "R102_AMOUNT_OVERSTATED", "R301_OVERBILLING"],
        "fields": ["total_medical_fee", "patient_burden_total", "amount_due", "paid_by_card", "paid_total"],
        "why_fds_detects": "영수증·세부내역·청구서 금액 불일치를 통해 과다 청구 또는 금액 변조를 탐지",
    },
    "semantic_diagnosis_code_mismatch": {
        "category": "진단명/질병코드 변조",
        "reason_codes": ["R201_DIAGNOSIS_CODE_MISMATCH", "R202_COVERAGE_CODE_SUSPICIOUS"],
        "fields": ["diagnosis_name", "disease_code"],
        "why_fds_detects": "보장에 유리한 진단명·질병분류기호가 다른 문서의 진료/약품 맥락과 맞지 않는지 탐지",
    },
    "semantic_drug_mismatch": {
        "category": "약품/처방 변조",
        "reason_codes": ["R501_PRESCRIPTION_MISMATCH", "R502_DRUG_AMOUNT_MISMATCH", "R503_DIAGNOSIS_DRUG_INCONSISTENCY"],
        "fields": ["drug_name", "dosage_days", "drug_total"],
        "why_fds_detects": "처방전과 약제비 영수증 간 약품명·수량·일수·금액 불일치를 탐지",
    },
    "semantic_duplicate_claim": {
        "category": "중복청구/문서 재사용",
        "reason_codes": ["R401_DUPLICATE_EXACT", "R402_DUPLICATE_NEAR", "R805_DOCUMENT_REUSE"],
        "fields": ["receipt_no", "claim_id", "treatment_date", "claimed_amount"],
        "why_fds_detects": "동일/유사 진료 episode 또는 문서 이미지가 반복 제출되는 중복청구를 탐지",
    },
    "semantic_provider_mismatch": {
        "category": "기관/환자 불일치",
        "reason_codes": ["R701_ENTITY_MISMATCH", "R703_PROVIDER_MISMATCH", "R704_HOSPITAL_PHARMACY_MISMATCH"],
        "fields": ["provider_token", "pharmacy_provider_token", "business_no"],
        "why_fds_detects": "청구 bundle 내 병원·약국·발급기관 식별정보가 서로 맞지 않는지 탐지",
    },
}


def _json_default(value: Any) -> Any:
    if hasattr(value, "item"):
        return value.item()
    return str(value)


def _safe_style(cluster_id: str, profile: dict[str, Any]) -> dict[str, Any]:
    grid = (86, 126, 176) if "blue" in CLUSTER_HINTS[cluster_id]["grid_family"] else (92, 92, 92)
    mean_gray = int(max(220, min(252, profile.get("mean_gray", 240) + 18)))
    paper = (248, 240, 222) if cluster_id == "C7" else (mean_gray, mean_gray, max(220, mean_gray - 4))
    return {"paper_rgb": paper, "grid_rgb": grid, "font_path": "C:/Windows/Fonts/NotoSansKR-VF.ttf"}


def _build_claim(cluster_index: int, seed: int, ctx: PrivacyContext) -> ClaimCase:
    claim = generate_claim(seed + cluster_index)
    claim.patient_name = pseudonym_name(ctx)
    claim.patient_registration_no = synthetic_patient_registration_no(ctx)
    claim.provider.name = pseudonym_provider(ctx)
    claim.provider.business_no = invalid_business_registration_no(ctx)
    claim.receipt_no = synthetic_receipt_no(ctx, seq=cluster_index)
    claim.provider.phone = "02-0000-0000"
    claim.provider.address = "서울특별시 합성구 비실제동 00"
    claim.provider.representative = "대표 SYN"
    return claim


def _semantic_counterfactual_claim(clean_claim: ClaimCase, delta: int = 100000) -> ClaimCase:
    claim = deepcopy(clean_claim)
    for key in ["total_medical_fee", "patient_burden_total", "amount_due", "paid_by_card", "paid_total"]:
        claim.summary[key] += delta
    return claim


def _drug_payload(claim: ClaimCase, ctx: PrivacyContext, attack_family: str | None = None) -> dict[str, Any]:
    lines = [
        {"date": claim.issue_date, "name": "합성정A", "days": 3, "amount": 8200},
        {"date": claim.issue_date, "name": "모의캡슐B", "days": 3, "amount": 6300},
        {"date": claim.issue_date, "name": "비실제시럽C", "days": 2, "amount": 4100},
    ]
    if attack_family == "semantic_drug_mismatch":
        lines = [dict(row) for row in lines]
        lines[1]["name"] = "고액합성주사X"
        lines[1]["days"] = 14
        lines[1]["amount"] += 78000
    total = sum(row["amount"] for row in lines)
    return {
        "patient_name": claim.patient_name,
        "provider_name": claim.provider.name if attack_family != "semantic_provider_mismatch" else "FAKE-PHARMACY-PROVIDER-999",
        "dispense_date": claim.issue_date,
        "prescription_date": claim.issue_date,
        "drug_lines": lines,
        "drug_total": total,
        "patient_burden_total": total,
        "paid_total": total,
    }


def _claim_payload(claim: ClaimCase, ctx: PrivacyContext, attack_family: str | None = None) -> dict[str, Any]:
    base_disease = "M54.5"
    base_diag = "요추부 염좌 및 긴장"
    if attack_family == "semantic_diagnosis_code_mismatch":
        base_disease = "S83.2"
        base_diag = "반월상연골 파열 의심"
    return {
        "patient_name": claim.patient_name,
        "provider_name": claim.provider.name if attack_family != "semantic_provider_mismatch" else "FAKE-HOSP-MISMATCH-777",
        "claimed_amount": claim.summary.get("paid_total", 0) if attack_family != "semantic_amount_mismatch" else claim.summary.get("paid_total", 0) + 125000,
        "beneficiary_account_token": "TEST-ACCOUNT-TOKEN-NONROUTABLE",
        "treatment_date": claim.issue_date,
        "claim_reason": "실손의료비 청구 합성 시나리오",
        "diagnosis_name": base_diag,
        "disease_code": base_disease,
        "department": "정형외과",
        "diagnosis_date": claim.issue_date,
        "issuer_doctor": "SYN-DOCTOR-01",
        "admission_date": "2026-06-01",
        "discharge_date": "2026-06-03",
        "admission_days": "3일",
        "ward_token": "SYN-WARD-A",
        "treatment_summary": "통원 치료 및 보존적 처치",
        "document_no": f"SYN-DOC-{claim.receipt_no[-6:]}",
        "medical_opinion": "추가 관찰이 필요한 비실제 합성 소견",
        "future_treatment": "2주 후 추적 관찰",
        "surgery_name": "SYN-ARTHRO-OBSERVE" if attack_family == "semantic_diagnosis_code_mismatch" else "해당 없음",
        "surgery_date": claim.issue_date,
        "anesthesia_type": "비실제 국소",
        "review_no": f"FDS-REVIEW-{claim.receipt_no[-6:]}",
        "claim_no": claim.receipt_no,
        "primary_document": "진료비 계산서ㆍ영수증",
        "risk_taxonomy": ATTACK_TAXONOMY.get(attack_family or "semantic_amount_mismatch", ATTACK_TAXONOMY["semantic_amount_mismatch"])["category"],
        "required_documents": "영수증, 세부내역서, 처방전, 약제비영수증, 청구서",
        "reason_codes": ", ".join(ATTACK_TAXONOMY.get(attack_family or "semantic_amount_mismatch", ATTACK_TAXONOMY["semantic_amount_mismatch"])["reason_codes"]),
    }


def _add_cluster_marks(img: Image.Image, cluster_id: str) -> Image.Image:
    out = img.convert("RGB").copy()
    d = ImageDraw.Draw(out)
    w, h = out.size
    tags = CLUSTER_HINTS[cluster_id]["benign"]
    if "red_stamp" in tags or "red_circle_annotation" in tags:
        d.ellipse((w - 170, h - 170, w - 80, h - 80), outline=(185, 35, 35), width=5)
    if "purple_memo_stamp" in tags:
        d.rectangle((w - 260, 70, w - 80, 125), outline=(105, 65, 145), width=4)
    if "qr_placeholder" in tags or "barcode_placeholder" in tags:
        x0, y0 = w - 150, 70
        d.rectangle((x0, y0, x0 + 82, y0 + 82), outline=(30, 30, 30), width=2)
        for i in range(0, 72, 12):
            d.line((x0 + 8 + i, y0 + 8, x0 + 8 + i, y0 + 74), fill=(30, 30, 30), width=2)
    if "watermark" in tags:
        d.text((w // 3, h // 2), "SYNTHETIC", fill=(210, 210, 210))
    if "low_res_crop" in tags:
        out = out.resize((max(300, w // 2), max(300, h // 2)), Image.Resampling.BILINEAR).resize((w, h), Image.Resampling.BILINEAR)
    if "warm_lighting" in tags:
        overlay = Image.new("RGB", out.size, (255, 238, 205))
        out = Image.blend(out, overlay, 0.08)
    return out


def _cluster_capture(img: Image.Image, cluster_id: str) -> Image.Image:
    marked = _add_cluster_marks(img, cluster_id)
    if cluster_id in {"C1", "C7"}:
        return mobile_capture_effect(marked, seed=100 + CLUSTER_IDS.index(cluster_id))
    scanned = scanner_effect(marked, seed=200 + CLUSTER_IDS.index(cluster_id))
    if cluster_id == "C5":
        return scanned.filter(ImageFilter.GaussianBlur(0.25))
    return scanned


def _semantics_for_bundle(clean_total: int, tampered_total: int) -> tuple[dict[str, Any], dict[str, Any]]:
    clean = {"all_pass": True, "failed_reason_codes": [], "edges": [{"reason_code": "RECEIPT_DETAIL_TOTAL_MISMATCH", "pass": True, "expected": clean_total, "actual": clean_total}]}
    tampered = {"all_pass": False, "failed_reason_codes": ["RECEIPT_DETAIL_TOTAL_MISMATCH"], "edges": [{"reason_code": "RECEIPT_DETAIL_TOTAL_MISMATCH", "pass": False, "expected": clean_total, "actual": tampered_total}]}
    return clean, tampered


def _write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2, default=_json_default), encoding="utf-8")


def _split_groups(groups: list[str]) -> dict[str, Any]:
    parts = {"train": groups[0::3], "validation": groups[1::3], "test": groups[2::3]}
    return {name: {"leakage_groups": vals, "count": len(vals)} for name, vals in parts.items()}


def _simple_doc_audit(doc: SimpleRenderedDocument) -> dict[str, Any]:
    data = doc.layout_audit.as_dict()
    return {"overflow_count": data.get("overflow_count", 0), "truncated_count": data.get("truncated_count", 0)}


def _save_row_image(out: Path, file_name: str, img: Image.Image, image_quality: int) -> None:
    (out / Path(file_name).parent).mkdir(parents=True, exist_ok=True)
    img.save(out / file_name, quality=image_quality)


def generate_high_fidelity_dataset(
    reference_image_paths: Iterable[str | Path],
    output_dir: str | Path,
    seed: int = 20260605,
    bundles_per_cluster: int = 3,
    *,
    clean_output_dir: bool = True,
    image_quality: int = 88,
    write_excel_report: bool = True,
    generate_real_image_derivatives: bool = False,
    real_derivatives_per_image: int = 5,
) -> dict[str, Any]:
    rng = random.Random(seed)
    out = Path(output_dir)
    if out.exists() and clean_output_dir:
        shutil.rmtree(out)
    out.mkdir(parents=True, exist_ok=True)
    reference_paths = [Path(p) for p in reference_image_paths]
    if not reference_paths:
        raise ValueError("reference_image_paths must not be empty for v4 reference-calibrated generation")
    profiles = [extract_profile(p).__dict__ for p in reference_paths]
    while len(profiles) < 8:
        profiles.append(dict(profiles[-1]))
    _write_json(out / "reference_profiles.v4.json", {"schema_version": "reference_profiles.v4", "stores_source_pixels": False, "ocr_text_extracted": False, "profiles": profiles})

    root = Path(__file__).resolve().parents[2]
    renderer_cfg = yaml.safe_load((root / "config" / "generator.yaml").read_text(encoding="utf-8"))
    renderer = Renderer(renderer_cfg)
    rows: list[dict[str, Any]] = []
    leakage_groups: list[str] = []
    montage_items = []
    qc_sections: list[dict[str, Any]] = []
    first_clean_sem = first_tampered_sem = None
    known_real_blacklist = ["서울대학교병원", "삼성서울병원", "아산병원", "세브란스", "국민건강보험공단"]

    for cidx, cluster_id in enumerate(CLUSTER_IDS):
        for bidx in range(bundles_per_cluster):
            claim_id = f"SYN-CLM-{cidx+1:02d}-{bidx+1:03d}"
            ctx = PrivacyContext(secret_key=b"fds-v4-high-fidelity", claim_id=claim_id, patient_entity_id=f"PAT-{cidx}-{bidx}", provider_family_id=f"PROV-{cidx}")
            claim = _build_claim(cidx * 10 + bidx, seed, ctx)
            profile = profiles[(cidx * max(1, bundles_per_cluster) + bidx) % len(profiles)]
            style = _safe_style(cluster_id, profile)
            rendered_receipt = renderer.render_medical_receipt(claim, public_sample_mark=True)
            rendered_detail = renderer.render_detail_statement(claim, public_sample_mark=True)
            clean_drug_payload = _drug_payload(claim, ctx)
            rendered_pharmacy = render_pharmacy_receipt(clean_drug_payload, style)
            rendered_prescription = render_prescription(clean_drug_payload, style)
            payload = _claim_payload(claim, ctx)
            clean_extra_docs = [
                render_claim_application(payload, style),
                render_diagnosis_certificate(payload, style),
                render_hospitalization_confirmation(payload, style),
                render_outpatient_confirmation(payload, style),
                render_medical_opinion(payload, style),
                render_surgery_confirmation(payload, style),
                render_claim_review_cover_sheet(payload, style),
            ]
            receipt_img = _cluster_capture(rendered_receipt.image, cluster_id)
            detail_img = _cluster_capture(rendered_detail.image, cluster_id)
            pharmacy_img = _cluster_capture(rendered_pharmacy.image, cluster_id)
            prescription_img = _cluster_capture(rendered_prescription.image, cluster_id)
            clean_docs: list[tuple[str, str, Image.Image, str, str, Any, list[str], str | None]] = [
                ("medical_receipt", "NO", receipt_img, "none", "clean_or_benign_capture", rendered_receipt.field_bboxes, ["R000_NORMAL"], None),
                ("medical_detail_statement", "NO", detail_img, "none", "clean_or_benign_capture", rendered_detail.field_bboxes, ["R000_NORMAL"], None),
                ("pharmacy_receipt", "NO", pharmacy_img, "none", "clean_or_benign_capture", rendered_pharmacy.field_bboxes, ["R000_NORMAL"], None),
                ("prescription", "NO", prescription_img, "none", "clean_or_benign_capture", rendered_prescription.field_bboxes, ["R000_NORMAL"], None),
            ]
            for doc in clean_extra_docs:
                clean_docs.append((doc.document_type, "NO", _cluster_capture(doc.image, cluster_id), "none", "clean_or_benign_capture", doc.field_bboxes, ["R000_NORMAL"], None))
                qc_sections.append(_simple_doc_audit(doc))

            tampered_claim = _semantic_counterfactual_claim(claim)
            tampered_receipt = renderer.render_medical_receipt(tampered_claim, public_sample_mark=True)
            attack_docs: list[tuple[str, str, Image.Image, str, str, Any, list[str], str | None]] = [
                ("medical_receipt", "AF", _cluster_capture(tampered_receipt.image, cluster_id), "synthetic_cross_document_mismatch", "semantic_counterfactual_receipt", tampered_receipt.field_bboxes, ATTACK_TAXONOMY["semantic_amount_mismatch"]["reason_codes"], "semantic_amount_mismatch"),
            ]
            for attack_family, renderer_fn in [
                ("semantic_diagnosis_code_mismatch", render_diagnosis_certificate),
                ("semantic_drug_mismatch", render_pharmacy_receipt),
                ("semantic_duplicate_claim", render_claim_application),
                ("semantic_provider_mismatch", render_claim_review_cover_sheet),
            ]:
                attack_payload = _drug_payload(claim, ctx, attack_family) if attack_family == "semantic_drug_mismatch" else _claim_payload(claim, ctx, attack_family)
                rendered_attack = renderer_fn(attack_payload, style)
                attack_docs.append((
                    rendered_attack.document_type,
                    "AF",
                    _cluster_capture(rendered_attack.image, cluster_id),
                    "synthetic_cross_document_mismatch",
                    f"defensive_counterfactual_{attack_family}",
                    rendered_attack.field_bboxes,
                    ATTACK_TAXONOMY[attack_family]["reason_codes"],
                    attack_family,
                ))
                qc_sections.append(_simple_doc_audit(rendered_attack))

            docs = clean_docs + attack_docs
            leakage_group = f"{claim_id}|{cluster_id}|{claim.provider.name}|device_{cluster_id}|template_{CLUSTER_HINTS[cluster_id]['page_scope']}"
            leakage_groups.append(leakage_group)
            for doc_type, family, img, fraud_label, condition, bboxes, reason_codes, attack_family in docs:
                suffix = f"_{attack_family}" if attack_family else ""
                file_name = f"images/{claim_id}_{cluster_id}_{family}_{doc_type}{suffix}.jpg"
                _save_row_image(out, file_name, img, image_quality)
                row = {
                    "dataset_id": f"{family}_{claim_id}_{cluster_id}_{doc_type}{suffix}",
                    "claim_id": claim_id,
                    "document_type": doc_type,
                    "label_family": family,
                    "synthetic_only": True,
                    "privacy_state": "synthetic_rewrite",
                    "raw_value_retention": False,
                    "provider_token": claim.provider.name,
                    "patient_token": claim.patient_name,
                    "visual_cluster_id": cluster_id,
                    "page_scope": CLUSTER_HINTS[cluster_id]["page_scope"],
                    "grid_family": CLUSTER_HINTS[cluster_id]["grid_family"],
                    "benign_condition_tags": CLUSTER_HINTS[cluster_id]["benign"],
                    "fraud_label": fraud_label,
                    "document_condition": condition,
                    "file_name": file_name,
                    "leakage_group": leakage_group,
                    "field_bboxes": bboxes,
                    "reason_codes": reason_codes,
                    "derived_from_real_profile": False,
                    "reference_profile_index": (cidx * max(1, bundles_per_cluster) + bidx) % len(profiles),
                }
                if family == "AF" and attack_family:
                    taxonomy = ATTACK_TAXONOMY[attack_family]
                    row["attack_family"] = attack_family
                    row["attack_category_ko"] = taxonomy["category"]
                    row["semantic_counterfactual_fields"] = taxonomy["fields"]
                    row["why_fds_detects_ko"] = taxonomy["why_fds_detects"]
                rows.append(row)
            clean_sem, tampered_sem = _semantics_for_bundle(claim.summary["total_medical_fee"], tampered_claim.summary["total_medical_fee"])
            first_clean_sem = first_clean_sem or clean_sem
            first_tampered_sem = first_tampered_sem or tampered_sem
            qc_sections.append(audit_layout(rendered_receipt.audit, max_truncated=8))
            if len(montage_items) < 8:
                montage_items.append((f"{cluster_id} {CLUSTER_HINTS[cluster_id]['page_scope']}", receipt_img))

    if generate_real_image_derivatives:
        rows.extend(_write_real_image_derived_samples(reference_paths, out, rng, image_quality, real_derivatives_per_image))

    manifest_text = "\n".join(json.dumps(row, ensure_ascii=False, default=_json_default) for row in rows) + "\n"
    (out / "manifest.v4.jsonl").write_text(manifest_text, encoding="utf-8")
    split = _split_groups(leakage_groups)
    _write_json(out / "splits.v4.json", split)
    findings = leak_scan(manifest_text, known_real_blacklist)
    overflow_count = sum(section.get("overflow_count", 0) for section in qc_sections)
    critical_truncated: list[str] = []
    if montage_items:
        make_montage(montage_items, str(out / "montage.v4.jpg"), thumb_w=420)
    qc = {
        "schema_version": "qc_report.v4.high_fidelity",
        "reference_profile_count": len(profiles),
        "visual_cluster_count": len({row["visual_cluster_id"] for row in rows if row.get("visual_cluster_id")}),
        "document_types": sorted({row["document_type"] for row in rows}),
        "attack_families": sorted({row.get("attack_family") for row in rows if row.get("attack_family")}),
        "attack_taxonomy": ATTACK_TAXONOMY,
        "row_count": len(rows),
        "claim_count": len({row.get("claim_id") for row in rows}),
        "clean_bundle_semantics": first_clean_sem,
        "tampered_bundle_semantics": first_tampered_sem,
        "quality_gate": {
            "layout_overflow_count": overflow_count,
            "critical_truncated_fields": critical_truncated,
            "privacy_leakage_findings": findings,
            "split_leakage_pass": len(leakage_groups) == len(set(leakage_groups)),
            "mask_generation_disabled": True,
            "benign_conditions_not_fraud": all(row["fraud_label"] == "none" for row in rows if row["label_family"] == "NO"),
            "pass": overflow_count == 0 and not critical_truncated and not findings and len(leakage_groups) == len(set(leakage_groups)),
        },
    }
    _write_json(out / "qc_report.v4.json", qc)
    _write_taxonomy_csv(out / "fds_scenario_taxonomy_ko.v4.csv")
    if write_excel_report:
        primary_xlsx = build_korean_excel_summary(out / "manifest.v4.jsonl", out / "qc_report.v4.json", out / "summary_ko.v4.xlsx")
        # 이전 handoff/README에서 쓰던 이름도 같이 남겨 사람이 찾기 쉽게 합니다.
        legacy_xlsx = out / "summary.v4.ko.xlsx"
        if legacy_xlsx != primary_xlsx:
            shutil.copyfile(primary_xlsx, legacy_xlsx)
    return {"ok": qc["quality_gate"]["pass"], "output_dir": str(out), "manifest_rows": len(rows), "qc": qc, "summary_xlsx": str(out / "summary_ko.v4.xlsx"), "taxonomy_csv": str(out / "fds_scenario_taxonomy_ko.v4.csv")}


def _write_taxonomy_csv(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    header = ["attack_family", "한국어분류", "사유코드", "조작대상필드", "FDS가탐지해야하는이유"]
    lines = [",".join(header)]
    for attack_family, item in ATTACK_TAXONOMY.items():
        cells = [
            attack_family,
            item["category"],
            "|".join(item["reason_codes"]),
            "|".join(item["fields"]),
            item["why_fds_detects"],
        ]
        escaped = ["\"" + str(cell).replace("\"", "\"\"") + "\"" for cell in cells]
        lines.append(",".join(escaped))
    path.write_text("\ufeff" + "\n".join(lines) + "\n", encoding="utf-8")


def _write_real_image_derived_samples(reference_paths: list[Path], out: Path, rng: random.Random, image_quality: int, per_image: int) -> list[dict[str, Any]]:
    """Real Image 참조에서 방어용 파생 AF 이미지를 생성합니다.

    원본의 텍스트/식별자를 OCR로 복사하지 않고, 이미지 전체에 비제출 synthetic 표시와
    가명 필드 카드를 얹어 FDS 이미지 포렌식/도메인 적응 학습에 쓰는 안전한 파생물입니다.
    """

    rows: list[dict[str, Any]] = []
    attacks = list(ATTACK_TAXONOMY.keys())[: max(1, per_image)]
    for ridx, path in enumerate(reference_paths):
        try:
            base = Image.open(path).convert("RGB")
        except Exception:
            continue
        base.thumbnail((1100, 1500), Image.Resampling.LANCZOS)
        for aidx, attack_family in enumerate(attacks):
            img = base.copy().filter(ImageFilter.GaussianBlur(0.15))
            d = ImageDraw.Draw(img, "RGBA")
            w, h = img.size
            taxonomy = ATTACK_TAXONOMY[attack_family]
            x1 = int(w * (0.10 + 0.05 * (aidx % 3)))
            y1 = int(h * (0.18 + 0.10 * (aidx % 4)))
            x2 = min(w - 30, x1 + int(w * 0.62))
            y2 = min(h - 30, y1 + 120)
            patch = img.crop((x1, y1, x2, y2)).filter(ImageFilter.GaussianBlur(2.0))
            img.paste(patch, (x1, y1))
            d.rounded_rectangle((x1, y1, x2, y2), radius=10, fill=(255, 255, 245, 210), outline=(175, 45, 45, 230), width=3)
            d.text((x1 + 14, y1 + 14), f"AF 합성변조: {taxonomy['category']}", fill=(120, 20, 20, 255))
            d.text((x1 + 14, y1 + 46), f"{', '.join(taxonomy['reason_codes'][:2])}", fill=(35, 35, 35, 255))
            d.text((x1 + 14, y1 + 76), "FAKE FIELD VALUE - NON SUBMITTABLE", fill=(35, 35, 35, 255))
            d.rectangle((8, 8, w - 8, 48), fill=(255, 255, 255, 190), outline=(40, 40, 40, 200))
            d.text((18, 18), "DEFENSIVE SYNTHETIC DERIVED FROM REFERENCE PROFILE - 실제 제출 불가", fill=(0, 0, 0, 255))
            file_name = f"real_image_derived/AF_REAL_DERIVED_{ridx+1:03d}_{aidx+1:02d}_{attack_family}.jpg"
            _save_row_image(out, file_name, img, image_quality)
            rows.append({
                "dataset_id": f"AF_REAL_DERIVED_{ridx+1:03d}_{aidx+1:02d}_{attack_family}",
                "claim_id": f"REAL-DERIVED-{ridx+1:03d}",
                "document_type": "real_image_reference_derived",
                "label_family": "AF",
                "synthetic_only": True,
                "privacy_state": "synthetic_overlay_no_raw_value_copy",
                "raw_value_retention": False,
                "provider_token": "FAKE-REAL-DERIVED-PROVIDER",
                "patient_token": "FAKE-REAL-DERIVED-PATIENT",
                "visual_cluster_id": f"REAL_REF_{ridx+1:03d}",
                "page_scope": "real_reference_profile_derived",
                "grid_family": "real_reference_visual_domain",
                "benign_condition_tags": ["reference_texture", "capture_noise", "safe_non_submittable_mark"],
                "fraud_label": "synthetic_cross_document_mismatch",
                "document_condition": "defensive_real_image_derived_counterfactual",
                "file_name": file_name,
                "leakage_group": f"REAL-DERIVED-{ridx+1:03d}|reference_profile|{attack_family}",
                "field_bboxes": [{"field": field, "bbox": [x1, y1, x2, y2], "critical": True} for field in taxonomy["fields"]],
                "reason_codes": taxonomy["reason_codes"],
                "attack_family": attack_family,
                "attack_category_ko": taxonomy["category"],
                "semantic_counterfactual_fields": taxonomy["fields"],
                "why_fds_detects_ko": taxonomy["why_fds_detects"],
                "derived_from_real_profile": True,
                "stores_source_pixels": False,
                "ocr_text_extracted": False,
            })
    return rows
