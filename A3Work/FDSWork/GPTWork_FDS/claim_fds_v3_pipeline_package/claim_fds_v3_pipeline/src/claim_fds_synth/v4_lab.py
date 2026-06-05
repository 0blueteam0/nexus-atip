from __future__ import annotations

import copy
import json
from pathlib import Path

from PIL import Image

from .claim_data import generate_claim
from .consistency_graph import evaluate_bundle_consistency, make_claim_bundle_metadata
from .degradation import fold_effect, scanner_effect, slight_torn_edge
from .montage import make_montage
from .qc import audit_layout, validate_medical_receipt_semantics
from .quality_gate import evaluate_quality_gate, make_leakage_safe_splits
from .reference_profiler import profile_reference_set
from .renderer import Renderer
from .tamper import post_scan_local_tamper
from .template_family import sample_template_family


def _write_json(path: Path, data: dict) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def _base_config(seed: int, template_family: dict) -> dict:
    """v3 renderer와 호환되는 v4 config를 만든다.

    참조 프로파일에서 샘플링한 margin만 주입하고, 실제 이미지를 복제하는 좌표는 쓰지 않는다.
    """

    return {
        "seed": seed,
        "page": {"dpi": 200, "width_px": 1654, "height_px": 2339, "margin_px": template_family["rendering"]["margin_px"]},
        "fonts": {
            "primary": "/usr/share/fonts/truetype/nanum/NanumGothic.ttf",
            "primary_bold": "/usr/share/fonts/truetype/nanum/NanumGothicBold.ttf",
            "mono": "/usr/share/fonts/truetype/nanum/NanumGothicCoding.ttf",
        },
        "quality": {"max_truncated_fields": 8},
    }


def _manifest_rows(bundle: dict, tamper: object) -> list[dict]:
    """JSONL manifest용 최소 row 집합을 생성한다."""

    common = {
        "synthetic_only": True,
        "provider_token": bundle["provider_token"],
        "template_family_id": bundle["template_family_id"],
        "device_profile_id": bundle["device_profile_id"],
        "leakage_group": bundle["leakage_group"],
    }
    return [
        {
            **common,
            "dataset_id": "NO_V4_MEDICAL_RECEIPT_CLEAN_0001",
            "label_family": "NO",
            "document_type": "medical_receipt",
            "file_name": "v4_01_medical_receipt_clean_scan.jpg",
            "fraud_label": "none",
            "document_condition": "clean_scan",
        },
        {
            **common,
            "dataset_id": "NO_V4_MEDICAL_RECEIPT_FOLDED_0001",
            "label_family": "NO",
            "document_type": "medical_receipt",
            "file_name": "v4_04_folded_benign.jpg",
            "fraud_label": "none",
            "document_condition": "benign_document_condition",
        },
        {
            **common,
            "dataset_id": "NO_V4_MEDICAL_RECEIPT_TORN_EDGE_0001",
            "label_family": "NO",
            "document_type": "medical_receipt",
            "file_name": "v4_05_slight_torn_benign.jpg",
            "fraud_label": "none",
            "document_condition": "benign_document_condition_margin_only",
        },
        {
            **common,
            "dataset_id": "AF_V4_MEDICAL_RECEIPT_AMOUNT_PATCH_0001",
            "label_family": "AF",
            "document_type": "medical_receipt",
            "file_name": "v4_02_medical_receipt_tampered.jpg",
            "fraud_label": "synthetic_amount_substitution",
            "document_condition": "post_scan_local_patch",
            "attack_family": "amount_substitution",
            "changed_fields": tamper.changed_fields,
        },
    ]


def generate_v4_lab(output_dir: str | Path, reference_dir: str | Path, seed: int = 20260605) -> dict:
    """v4 reference-calibrated synthetic lab 산출물을 생성한다.

    실제 참조 이미지는 통계 프로파일로만 읽고, 출력 이미지/manifest에는 모두 허구값과
    synthetic provenance만 남긴다. 이 함수는 run_demo에서 자동 호출될 수 있도록 설계했다.
    """

    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)
    profile = profile_reference_set(reference_dir, profile_id="real_image_statistical_profile")
    family = sample_template_family(profile, seed=seed)
    cfg = _base_config(seed, family)
    claim = generate_claim(seed=seed)
    renderer = Renderer(cfg)
    receipt = renderer.render_medical_receipt(claim, public_sample_mark=True)
    detail = renderer.render_detail_statement(claim, public_sample_mark=True)

    clean_scan = scanner_effect(receipt.image, seed=seed + 1, quality=family["capture_profile"]["scanner_quality"])
    tamper = post_scan_local_tamper(clean_scan, claim, receipt.field_bboxes, cfg["fonts"], seed=seed + 2)
    folded = fold_effect(clean_scan, seed=seed + 3, vertical=True, strength=0.35)
    torn = slight_torn_edge(clean_scan, seed=seed + 4, side="right", max_depth=family["capture_profile"]["torn_edge_max_depth_px"])
    detail_scan = scanner_effect(detail.image, seed=seed + 5, quality=family["capture_profile"]["scanner_quality"])

    clean_scan.save(out / "v4_01_medical_receipt_clean_scan.jpg", quality=88)
    tamper.image.save(out / "v4_02_medical_receipt_tampered.jpg", quality=88)
    tamper.mask.save(out / "v4_03_tamper_mask.png")
    folded.save(out / "v4_04_folded_benign.jpg", quality=88)
    torn.save(out / "v4_05_slight_torn_benign.jpg", quality=88)
    detail_scan.save(out / "v4_06_detail_statement_clean_scan.jpg", quality=88)

    _write_json(out / "reference_profile.v1.json", profile)
    _write_json(out / "template_family.v1.json", family)

    bundle = make_claim_bundle_metadata(claim, family, claim_pair_id="SYN-V4-PAIR-0001")
    clean_graph = evaluate_bundle_consistency(claim, claim)
    tampered_detail_claim = copy.deepcopy(claim)
    tampered_graph = evaluate_bundle_consistency(tamper.tampered_claim, tampered_detail_claim)
    rows = _manifest_rows(bundle, tamper)
    (out / "manifest.v4.jsonl").write_text("\n".join(json.dumps(row, ensure_ascii=False) for row in rows) + "\n", encoding="utf-8")
    _write_json(out / "splits.v4.json", make_leakage_safe_splits(rows))

    qc = {
        "schema_version": "qc_report.v4",
        "reference_profile_summary": {"document_count": profile["document_count"], "source_pixels_stored": False},
        "clean_semantics": validate_medical_receipt_semantics(claim),
        "tampered_semantics": validate_medical_receipt_semantics(tamper.tampered_claim),
        "clean_bundle_graph": clean_graph,
        "tampered_bundle_graph": tampered_graph,
        "layout_receipt": audit_layout(receipt.audit, max_truncated=cfg["quality"]["max_truncated_fields"]),
        "layout_detail_statement": audit_layout(detail.audit, max_truncated=cfg["quality"]["max_truncated_fields"]),
    }
    qc["quality_gate"] = evaluate_quality_gate(qc, tamper.mask, tamper.changed_fields, rows)
    _write_json(out / "qc_report_v4.json", qc)

    make_montage([
        ("v4 clean scanner / profile sampled", clean_scan),
        ("v4 tampered local patch", tamper.image),
        ("v4 tamper mask", tamper.mask.convert("RGB")),
        ("v4 folded benign", folded),
        ("v4 torn edge benign", torn),
        ("v4 paired detail statement", detail_scan),
    ], str(out / "v4_montage.png"), thumb_w=620)
    return {"ok": qc["quality_gate"]["pass"], "output_dir": str(out), "quality_gate": qc["quality_gate"]}
