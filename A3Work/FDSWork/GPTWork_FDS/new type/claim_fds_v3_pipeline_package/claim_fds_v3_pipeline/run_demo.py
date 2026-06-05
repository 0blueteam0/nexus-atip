from __future__ import annotations

import json
from pathlib import Path
import yaml
from PIL import Image

from src.claim_fds_synth.claim_data import generate_claim
from src.claim_fds_synth.renderer import Renderer
from src.claim_fds_synth.degradation import scanner_effect, fold_effect, crumple_effect, slight_torn_edge, mobile_capture_effect
from src.claim_fds_synth.tamper import post_scan_local_tamper
from src.claim_fds_synth.qc import validate_medical_receipt_semantics, audit_layout
from src.claim_fds_synth.montage import make_montage

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "outputs"
OUT.mkdir(exist_ok=True)


def main() -> None:
    cfg = yaml.safe_load((ROOT / "config/generator.yaml").read_text(encoding="utf-8"))
    field_map = yaml.safe_load((ROOT / "config/field_map.v2024.yaml").read_text(encoding="utf-8"))
    claim = generate_claim(seed=cfg["seed"])
    r = Renderer(cfg)

    receipt = r.render_medical_receipt(claim, public_sample_mark=True)
    detail = r.render_detail_statement(claim, public_sample_mark=True)

    clean_render_path = OUT / "v3_01_medical_receipt_pristine.png"
    clean_scan_path = OUT / "v3_02_medical_receipt_clean_scan.jpg"
    tampered_path = OUT / "v3_03_medical_receipt_post_scan_tampered.jpg"
    mask_path = OUT / "v3_04_tamper_mask.png"
    overlay_path = OUT / "v3_05_tamper_overlay.png"
    folded_path = OUT / "v3_06_medical_receipt_folded_benign.jpg"
    crumpled_torn_path = OUT / "v3_07_medical_receipt_crumpled_torn_benign.jpg"
    mobile_path = OUT / "v3_08_medical_receipt_mobile_capture.jpg"
    detail_path = OUT / "v3_09_detail_statement_clean_scan.jpg"

    receipt.image.save(clean_render_path)
    clean_scan = scanner_effect(receipt.image, seed=101, quality=78)
    clean_scan.save(clean_scan_path, quality=88)

    tamper = post_scan_local_tamper(clean_scan, claim, receipt.field_bboxes, cfg["fonts"], seed=203)
    tamper.image.save(tampered_path, quality=88)
    tamper.mask.save(mask_path)

    # Create overlay preview.
    overlay = tamper.image.convert("RGBA")
    mask_col = tamper.mask.convert("RGBA")
    pix = mask_col.load()
    for y in range(mask_col.height):
        for x in range(mask_col.width):
            if pix[x, y][0] > 0:
                pix[x, y] = (255, 35, 35, 86)
            else:
                pix[x, y] = (0, 0, 0, 0)
    overlay = Image.alpha_composite(overlay, mask_col)
    overlay.convert("RGB").save(overlay_path, quality=88)

    folded = fold_effect(clean_scan, seed=309, vertical=True, strength=0.45)
    folded.save(folded_path, quality=88)
    crumpled = crumple_effect(clean_scan, seed=411, strength=0.40)
    torn = slight_torn_edge(crumpled, seed=412, side="right", max_depth=30)
    torn.save(crumpled_torn_path, quality=88)
    mobile = mobile_capture_effect(clean_scan, seed=515)
    mobile.save(mobile_path, quality=88)
    detail_scan = scanner_effect(detail.image, seed=616, quality=78)
    detail_scan.save(detail_path, quality=88)

    qc = {
        "layout_receipt": audit_layout(receipt.audit, max_truncated=cfg["quality"]["max_truncated_fields"]),
        "layout_detail_statement": audit_layout(detail.audit, max_truncated=cfg["quality"]["max_truncated_fields"]),
        "clean_semantics": validate_medical_receipt_semantics(claim),
        "tampered_semantics": validate_medical_receipt_semantics(tamper.tampered_claim),
        "tampered_expected_to_fail_semantic_checks": True,
        "receipt_field_bbox_count": len(receipt.field_bboxes),
        "detail_field_bbox_count": len(detail.field_bboxes),
    }
    (OUT / "qc_report.json").write_text(json.dumps(qc, ensure_ascii=False, indent=2), encoding="utf-8")

    manifest = {
        "dataset_version": "claim_fds_synth_v3_reference_calibrated_skeleton",
        "safety": field_map["safety_guards"],
        "claim": claim.asdict(),
        "files": {
            "medical_receipt_pristine": clean_render_path.name,
            "medical_receipt_clean_scan": clean_scan_path.name,
            "medical_receipt_post_scan_tampered": tampered_path.name,
            "tamper_mask": mask_path.name,
            "tamper_overlay": overlay_path.name,
            "medical_receipt_folded_benign": folded_path.name,
            "medical_receipt_crumpled_torn_benign": crumpled_torn_path.name,
            "medical_receipt_mobile_capture": mobile_path.name,
            "detail_statement_clean_scan": detail_path.name,
        },
        "tamper": {
            "attack_family": "post_scan_local_field_replacement + semantic_consistency_break",
            "changed_fields": tamper.changed_fields,
            "expected_reason_codes": [
                "RECEIPT_DETAIL_TOTAL_MISMATCH",
                "AMOUNT_SUM_MISMATCH",
                "LOCAL_PATCH_TEXTURE_MISMATCH",
                "ISSUE_DATE_TEMPORAL_ANOMALY"
            ],
        },
        "benign_degradation_labels": {
            "folded": "benign_document_condition",
            "crumpled": "benign_document_condition",
            "slight_torn_edge": "benign_document_condition_margin_only",
            "mobile_capture": "benign_capture_condition"
        },
        "layout_audit_summary": {
            "receipt_overflow_count": qc["layout_receipt"]["overflow_count"],
            "receipt_truncated_count": qc["layout_receipt"]["truncated_count"],
            "detail_overflow_count": qc["layout_detail_statement"]["overflow_count"],
            "detail_truncated_count": qc["layout_detail_statement"]["truncated_count"],
        }
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    field_report = ROOT / "FIELD_ALIGNMENT_REPORT.md"
    field_report.write_text("""# Field Alignment Report

## 핵심 변경

- 별지 제6호서식 2024.7.18 기준으로 `선택진료료` 계열을 제거하고 `제증명수수료`, `선별급여`, `기타`, `공단부담 총액`을 반영했습니다.
- 약제비 영수증 별지 제10호서식 2024.7.18 기준 필드맵을 별도로 정의했습니다.
- 처방전은 의료법 시행규칙 제12조 기재사항을 별도 문서 타입으로 분리했습니다.
- 표가 페이지 밖으로 삐져나가는 문제는 `draw_grid`의 합계 검증, `draw_text_box`의 font shrink/truncate, `LayoutAudit.overflow_records()`로 차단합니다.

## 생성 샘플 QC 기준

`outputs/qc_report.json`의 `overflow_count`가 0이 아니면 해당 샘플은 학습 투입 금지입니다.
`truncated_count`는 field 값이 너무 길어 축약된 수를 의미합니다. 실전 학습셋에서는 너무 높으면 해당 template family를 폐기합니다.

## 물리 훼손 augmentation 판정

- 접힘: 포함. 모바일 청구에서 흔한 정상 hard negative이며 OCR/위변조 localizer 과탐 방지에 유용합니다.
- 약한 구김: 포함. 종이 질감과 그림자 변화가 정상 문서에서도 발생하므로 양성/음성 양쪽에 넣습니다.
- 끝부분의 약한 찢김: 낮은 비율로 포함. 핵심 필드 미가림 조건에서만 사용합니다.
- 큰 찢김/가림/물번짐: FDS보다는 품질불량 재촬영 요청 라우팅에 가깝습니다. 사기 라벨로 넣지 않습니다.
""", encoding="utf-8")

    montage_path = OUT / "v3_montage.png"
    make_montage([
        ("1. Clean scanner view / no overflow", clean_scan),
        ("2. Post-scan subtle tamper", tamper.image),
        ("3. Tamper mask overlay", overlay.convert("RGB")),
        ("4. Folded benign hard negative", folded),
        ("5. Crumpled + slight torn edge", torn),
        ("6. Detail statement paired document", detail_scan),
    ], str(montage_path), thumb_w=620)
    print(json.dumps({"ok": True, "outputs": str(OUT), "qc": qc}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
