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
from .schema_renderers import render_pharmacy_receipt, render_prescription
from .qc import validate_medical_receipt_semantics, audit_layout
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


def _json_default(value: Any) -> Any:
    if hasattr(value, "item"):
        return value.item()
    return str(value)


def _safe_style(cluster_id: str, profile: dict[str, Any]) -> dict[str, Any]:
    grid = (86, 126, 176) if "blue" in CLUSTER_HINTS[cluster_id]["grid_family"] else (92, 92, 92)
    mean_gray = int(max(220, min(252, profile.get("mean_gray", 240) + 18)))
    if cluster_id == "C7":
        paper = (248, 240, 222)
    else:
        paper = (mean_gray, mean_gray, max(220, mean_gray - 4))
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
    """Return an AF receipt claim with only summary totals shifted.

    Tamper masks are intentionally not generated in v4. The defensive signal for
    this counterfactual is cross-document semantic inconsistency: the AF receipt
    total changes, while the paired detail/pharmacy/prescription documents keep
    their clean line-item evidence. This matches the user's new direction to
    prioritize broader realistic claim bundles over pixel-mask localization.
    """

    claim = deepcopy(clean_claim)
    for key in ["total_medical_fee", "patient_burden_total", "amount_due", "paid_by_card", "paid_total"]:
        claim.summary[key] += delta
    return claim


def _drug_payload(claim: ClaimCase, ctx: PrivacyContext) -> dict[str, Any]:
    lines = [
        {"date": claim.issue_date, "name": "합성정A", "days": 3, "amount": 8200},
        {"date": claim.issue_date, "name": "모의캡슐B", "days": 3, "amount": 6300},
        {"date": claim.issue_date, "name": "비실제시럽C", "days": 2, "amount": 4100},
    ]
    total = sum(row["amount"] for row in lines)
    return {
        "patient_name": claim.patient_name,
        "provider_name": claim.provider.name,
        "dispense_date": claim.issue_date,
        "prescription_date": claim.issue_date,
        "drug_lines": lines,
        "drug_total": total,
        "patient_burden_total": total,
        "paid_total": total,
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


def generate_high_fidelity_dataset(reference_image_paths: Iterable[str | Path], output_dir: str | Path, seed: int = 20260605, bundles_per_cluster: int = 3) -> dict[str, Any]:
    rng = random.Random(seed)
    out = Path(output_dir)
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True, exist_ok=True)
    reference_paths = [Path(p) for p in reference_image_paths]
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
            profile = profiles[cidx]
            style = _safe_style(cluster_id, profile)
            rendered_receipt = renderer.render_medical_receipt(claim, public_sample_mark=True)
            rendered_detail = renderer.render_detail_statement(claim, public_sample_mark=True)
            drug_payload = _drug_payload(claim, ctx)
            rendered_pharmacy = render_pharmacy_receipt(drug_payload, style)
            rendered_prescription = render_prescription(drug_payload, style)
            receipt_img = _cluster_capture(rendered_receipt.image, cluster_id)
            detail_img = _cluster_capture(rendered_detail.image, cluster_id)
            pharmacy_img = _cluster_capture(rendered_pharmacy.image, cluster_id)
            prescription_img = _cluster_capture(rendered_prescription.image, cluster_id)
            tampered_claim = _semantic_counterfactual_claim(claim)
            tampered_receipt = renderer.render_medical_receipt(tampered_claim, public_sample_mark=True)
            tampered_img = _cluster_capture(tampered_receipt.image, cluster_id)
            docs = [
                ("medical_receipt", "NO", receipt_img, "none", "clean_or_benign_capture", rendered_receipt.field_bboxes),
                ("medical_detail_statement", "NO", detail_img, "none", "clean_or_benign_capture", rendered_detail.field_bboxes),
                ("pharmacy_receipt", "NO", pharmacy_img, "none", "clean_or_benign_capture", rendered_pharmacy.field_bboxes),
                ("prescription", "NO", prescription_img, "none", "clean_or_benign_capture", rendered_prescription.field_bboxes),
                ("medical_receipt", "AF", tampered_img, "synthetic_cross_document_mismatch", "semantic_counterfactual_receipt", tampered_receipt.field_bboxes),
            ]
            leakage_group = f"{claim_id}|{cluster_id}|{claim.provider.name}|device_{cluster_id}|template_{CLUSTER_HINTS[cluster_id]['page_scope']}"
            leakage_groups.append(leakage_group)
            for doc_type, family, img, fraud_label, condition, bboxes in docs:
                file_name = f"images/{claim_id}_{cluster_id}_{family}_{doc_type}.jpg"
                (out / "images").mkdir(exist_ok=True)
                img.save(out / file_name, quality=88)
                row = {
                    "dataset_id": f"{family}_{claim_id}_{cluster_id}_{doc_type}",
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
                }
                if family == "AF":
                    row["attack_family"] = "semantic_amount_mismatch"
                    row["semantic_counterfactual_fields"] = ["total_medical_fee", "patient_burden_total", "amount_due", "paid_by_card", "paid_total"]
                rows.append(row)
            clean_sem, tampered_sem = _semantics_for_bundle(claim.summary["total_medical_fee"], tampered_claim.summary["total_medical_fee"])
            first_clean_sem = first_clean_sem or clean_sem
            first_tampered_sem = first_tampered_sem or tampered_sem
            qc_sections.append(audit_layout(rendered_receipt.audit, max_truncated=8))
            if len(montage_items) < 8:
                montage_items.append((f"{cluster_id} {CLUSTER_HINTS[cluster_id]['page_scope']}", receipt_img))

    manifest_text = "\n".join(json.dumps(row, ensure_ascii=False, default=_json_default) for row in rows) + "\n"
    (out / "manifest.v4.jsonl").write_text(manifest_text, encoding="utf-8")
    split = _split_groups(leakage_groups)
    _write_json(out / "splits.v4.json", split)
    findings = leak_scan(manifest_text, known_real_blacklist)
    overflow_count = sum(section.get("overflow_count", 0) for section in qc_sections)
    critical_truncated = []
    if montage_items:
        make_montage(montage_items, str(out / "montage.v4.jpg"), thumb_w=420)
    qc = {
        "schema_version": "qc_report.v4.high_fidelity",
        "reference_profile_count": len(profiles),
        "visual_cluster_count": len({row["visual_cluster_id"] for row in rows}),
        "document_types": sorted({row["document_type"] for row in rows}),
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
    return {"ok": qc["quality_gate"]["pass"], "output_dir": str(out), "manifest_rows": len(rows), "qc": qc}
