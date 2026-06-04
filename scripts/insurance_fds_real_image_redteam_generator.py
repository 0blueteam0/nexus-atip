#!/usr/bin/env python
"""실제 공개 이미지 후보 기반 한국 실손보험 FDS 레드팀 데이터 생성기.

입력은 `insurance_fds_public_image_collector.py`가 만든 quarantine 공개 이미지 후보다.
이 스크립트는 원본 후보를 그대로 학습 데이터로 확정하지 않는다. 대신 다음을 만든다.

1. NO_REAL_DERIVED_*: 실제 공개 후보 이미지에서 출처/PII 검토가 필요함을 유지한 privacy-safe derivative.
   - 스캐너 flatbed/ADF 느낌의 재스캔 변형을 포함한다.
   - PNG text chunk에 FDS metadata를 직접 삽입한다.
2. AF_REAL_DERIVED_*: 같은 실제 후보 이미지 위에 방어적 탐지용 synthetic tamper overlay를 얹은 레드팀 샘플.
   - 성명, 날짜, 진단명, 질병코드, 고가 약품, 금액, 중복청구, 스캐너 metadata mismatch 등을 라벨링한다.
   - 변조 영역 mask를 별도 PNG로 저장한다.
3. Excel index: 모든 파일의 source, label, capture metadata, scenario, review status를 표로 정리한다.

주의: AF overlay는 범죄 실행용 “위조 방법”이 아니라 모델이 탐지해야 할 anomaly label/mask다.
실제 개인정보가 보일 가능성이 있는 공개 후보는 계속 quarantine/review 상태로 둔다.
"""

from __future__ import annotations

import argparse
import json
import random
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont, PngImagePlugin
from openpyxl import Workbook

PAGE_SIZE = (1240, 1754)


def now_iso() -> str:
    """UTC ISO timestamp를 반환한다."""

    return datetime.now(timezone.utc).isoformat()


def safe_font(size: int) -> ImageFont.ImageFont:
    """한국어 표시 가능한 폰트를 우선 로드한다."""

    for candidate in ["C:/Windows/Fonts/malgun.ttf", "C:/Windows/Fonts/arial.ttf"]:
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size=size)
    return ImageFont.load_default()


def build_redteam_scenarios() -> list[dict[str, Any]]:
    """한국 실손보험 청구 FDS 레드팀 시나리오를 탐지 라벨 관점으로 정의한다."""

    rows = [
        ("AF_NAME_ALTERATION", "성명 변조", ["보험금청구서", "진료비영수증", "약제비영수증"], "피보험자명/수진자명", "합성홍길동 -> 합성김민수", ["cross_document_name_mismatch", "font_region_anomaly", "claimant_patient_mismatch"]),
        ("AF_BIRTHDATE_ALTERATION", "생년월일 변조", ["보험금청구서", "진료비영수증"], "생년월일", "1988-04-12 -> 1978-04-12", ["age_diagnosis_plausibility", "policy_holder_mismatch", "digit_level_tamper_mask"]),
        ("AF_VISIT_DATE_ALTERATION", "진료일자 변조", ["진료비영수증", "진료비세부산정내역서"], "진료일자", "면책기간/청구기한 회피형 날짜 변경", ["claim_time_vs_visit_time_delta", "receipt_detail_date_mismatch", "metadata_capture_before_visit"]),
        ("AF_ISSUE_DATE_ALTERATION", "발급일자 변조", ["진단서", "진료확인서", "진료비영수증"], "발급일자", "재발급/스캔시점과 발급일 불일치", ["issue_after_claim_violation", "scanner_pdf_creation_delta", "date_font_anomaly"]),
        ("AF_DIAGNOSIS_TO_HIGH_VALUE", "진단명 고보장 항목 변조", ["진단서", "진료확인서", "청구서"], "진단명/질병분류기호", "상세불명 두통 -> 추간판장애/도수치료 연계", ["kcd_diagnosis_consistency", "treatment_diagnosis_mismatch", "rare_high_value_shift"]),
        ("AF_KCD_CODE_SWAP", "질병분류기호 변조", ["진단서", "진료비세부산정내역서"], "KCD 코드", "R51 -> M51.2", ["code_name_pair_mismatch", "character_spacing_anomaly", "crossdoc_code_conflict"]),
        ("AF_EXPENSIVE_DRUG_INSERTION", "고가 약품 삽입", ["처방전", "약제비영수증"], "약품명/약제비", "일반 소염진통제 -> 고가 비급여 주사/영양제 항목 추가", ["drug_price_outlier", "prescription_pharmacy_line_mismatch", "line_item_insertion_mask"]),
        ("AF_NONSELFPAY_UPCODING", "비급여 항목 업코딩", ["진료비세부산정내역서", "진료비영수증"], "급여구분/비급여금액", "급여 항목을 비급여/선택진료로 바꿈", ["benefit_type_transition", "subtotal_formula_mismatch", "layout_row_anomaly"]),
        ("AF_TOTAL_AMOUNT_INFLATION", "총액/청구금액 부풀림", ["진료비영수증", "청구서"], "총진료비/본인부담금/청구금액", "87,500 -> 287,500", ["amount_formula_violation", "digit_width_inconsistency", "comma_position_anomaly"]),
        ("AF_LINE_ITEM_OVERCLAIM", "세부항목 과청구", ["진료비세부산정내역서"], "검사료/처치료/비급여 line", "불필요 line item 추가", ["row_count_outlier", "receipt_detail_total_mismatch", "copy_move_table_region"]),
        ("AF_DUPLICATE_CLAIM_REUSE", "중복청구 재사용", ["진료비영수증", "약제비영수증"], "영수증번호/진료일/금액", "동일 문서를 다른 claim_group으로 재사용", ["perceptual_hash_duplicate", "receipt_no_duplicate", "device_reuse_graph"]),
        ("AF_RECEIPT_NUMBER_ALTERATION", "영수증번호 변조", ["진료비영수증"], "영수증번호", "마지막 2~3자리만 변경", ["near_duplicate_receipt_no", "ocr_confusable_digit", "issuer_sequence_gap"]),
        ("AF_PROVIDER_NAME_ALTERATION", "의료기관/약국명 변조", ["진료비영수증", "약제비영수증"], "기관명/사업자번호", "기관명과 사업자번호 불일치", ["provider_registry_mismatch", "logo_text_conflict", "stamp_region_anomaly"]),
        ("AF_SCANNER_METADATA_MISMATCH", "스캐너 메타데이터 불일치", ["스캔제출본"], "DPI/PDF producer/생성시각", "300dpi flatbed처럼 보이나 mobile reupload metadata", ["dpi_layout_mismatch", "pdf_producer_device_conflict", "scan_time_cluster"]),
        ("AF_CAMERA_METADATA_DATE_CONFLICT", "휴대폰 촬영시각 충돌", ["휴대폰촬영본"], "EXIF 촬영일시", "진료 전 촬영된 것으로 보이는 metadata", ["exif_before_visit", "gallery_reupload_missing_exif", "claim_submission_delta"]),
        ("AF_YEAR_TEMPLATE_DRIFT_EXPLOIT", "연도별 서식 차이 악용", ["진료비영수증", "세부산정내역서"], "서식버전/항목명", "구서식에 신서식 항목 삽입", ["template_version_classifier", "field_presence_drift", "year_form_schema_mismatch"]),
    ]
    return [
        {
            "scenario_id": scenario_id,
            "name_ko": name,
            "document_targets": targets,
            "tamper_field_family": field,
            "synthetic_mutation_summary": mutation,
            "fds_detector_features": features,
            "safety_boundary": "탐지 라벨/마스크 생성을 위한 합성 변조. 실제 위조 실행 절차나 실제 PII는 포함하지 않음.",
        }
        for scenario_id, name, targets, field, mutation, features in rows
    ]


def save_png_with_metadata(image: Image.Image, path: Path, metadata: dict[str, Any]) -> None:
    """PNG text chunk에 FDS metadata를 직접 삽입해 저장한다."""

    path.parent.mkdir(parents=True, exist_ok=True)
    png_info = PngImagePlugin.PngInfo()
    for key, value in metadata.items():
        png_info.add_text(str(key), json.dumps(value, ensure_ascii=False, sort_keys=True) if isinstance(value, (dict, list)) else str(value))
    image.convert("RGB").save(path, pnginfo=png_info)


def fit_to_page(image: Image.Image) -> Image.Image:
    """실제 후보 이미지를 A4 스캔 페이지 형태의 캔버스에 맞춘다."""

    page = Image.new("RGB", PAGE_SIZE, "#f8f8f2")
    work = image.convert("RGB")
    work.thumbnail((PAGE_SIZE[0] - 120, PAGE_SIZE[1] - 160))
    x = (PAGE_SIZE[0] - work.width) // 2
    y = (PAGE_SIZE[1] - work.height) // 2
    page.paste(work, (x, y))
    return page


def apply_capture_profile(image: Image.Image, profile: str, rng: random.Random) -> Image.Image:
    """스캐너/휴대폰 제출 환경을 반영한 변형을 적용한다."""

    out = image.convert("RGB")
    if profile == "scanner_flatbed_300dpi":
        out = ImageEnhance.Contrast(out).enhance(1.08)
        out = ImageEnhance.Sharpness(out).enhance(1.35)
    elif profile == "scanner_adf_200dpi":
        out = out.rotate(rng.uniform(-0.7, 0.7), expand=False, fillcolor="#f8f8f2")
        draw = ImageDraw.Draw(out)
        for _ in range(8):
            x = rng.randint(40, out.width - 40)
            draw.line((x, 0, x + rng.randint(-3, 3), out.height), fill=(210, 210, 205), width=1)
        out = ImageEnhance.Sharpness(out).enhance(1.15)
    elif profile == "smartphone_topdown":
        out = out.rotate(rng.uniform(-1.8, 1.8), expand=False, fillcolor="#eeeeea")
        out = ImageEnhance.Brightness(out).enhance(rng.uniform(0.94, 1.05))
    elif profile == "smartphone_oblique":
        out = out.rotate(rng.uniform(-3.5, 3.5), expand=False, fillcolor="#e5e2dc")
        out = ImageEnhance.Contrast(out).enhance(0.96)
        out = out.filter(ImageFilter.GaussianBlur(radius=0.25))
    else:
        out = ImageEnhance.Contrast(out).enhance(1.18)
        out = ImageEnhance.Sharpness(out).enhance(1.08)
    return out


def metadata_for(prefix: str, dataset_id: str, source_record: dict[str, Any], profile: str, scenario: dict[str, Any] | None = None) -> dict[str, Any]:
    """파일에 직접 삽입할 FDS metadata를 구성한다."""

    capture = {
        "capture_profile": profile,
        "scanner.dpi": 300 if profile == "scanner_flatbed_300dpi" else 200 if profile == "scanner_adf_200dpi" else None,
        "scanner.color_mode": "RGB" if profile.startswith("scanner") else None,
        "file.synthetic_metadata_inserted": True,
        "file.privacy_review_status": "derived_from_public_quarantine_candidate",
        "EXIF.Make": "Samsung" if profile.startswith("smartphone") else None,
        "EXIF.Model": "Galaxy S24" if profile == "smartphone_topdown" else "iPhone 15" if profile == "smartphone_oblique" else None,
        "EXIF.DateTimeOriginal": "2026:05:18 14:22:11" if profile.startswith("smartphone") else None,
    }
    return {
        "fds_dataset_id": dataset_id,
        "fds_prefix": prefix,
        "fds_label_family": "normal_real_derived" if prefix == "NO" else "adversarial_synthetic_from_real_candidate",
        "source_dataset_id": source_record.get("dataset_id"),
        "source_url": source_record.get("source_url"),
        "source_page_url": source_record.get("source_page_url"),
        "document_type_guess": source_record.get("document_type_guess"),
        "privacy_review_status": "derived_quarantine_requires_manual_pii_review",
        "redistribution_status": "unknown_requires_source_review",
        "capture_metadata": capture,
        "redteam_scenario": scenario or {},
        "created_at": now_iso(),
    }


def tamper_box_for(index: int, image: Image.Image) -> tuple[int, int, int, int]:
    """AF overlay/mask 위치를 deterministic하게 분산한다."""

    width, height = image.size
    zones = [
        (int(width * 0.18), int(height * 0.18), int(width * 0.62), int(height * 0.23)),
        (int(width * 0.52), int(height * 0.26), int(width * 0.88), int(height * 0.31)),
        (int(width * 0.48), int(height * 0.42), int(width * 0.86), int(height * 0.48)),
        (int(width * 0.55), int(height * 0.58), int(width * 0.90), int(height * 0.64)),
        (int(width * 0.15), int(height * 0.70), int(width * 0.70), int(height * 0.76)),
    ]
    return zones[index % len(zones)]


def overlay_tamper(image: Image.Image, scenario: dict[str, Any], scenario_index: int) -> tuple[Image.Image, Image.Image]:
    """AF 탐지용 합성 변조 overlay와 mask를 만든다."""

    out = image.convert("RGB").copy()
    mask = Image.new("L", out.size, 0)
    draw = ImageDraw.Draw(out)
    mask_draw = ImageDraw.Draw(mask)
    box = tamper_box_for(scenario_index, out)
    label_map = {
        "AF_NAME_ALTERATION": "수진자명: 합성김민수",
        "AF_VISIT_DATE_ALTERATION": "진료일자: 2026-05-28",
        "AF_DIAGNOSIS_TO_HIGH_VALUE": "진단명: 추간판장애",
        "AF_EXPENSIVE_DRUG_INSERTION": "비급여 고가약품 185,000",
        "AF_TOTAL_AMOUNT_INFLATION": "청구금액 287,500",
        "AF_DUPLICATE_CLAIM_REUSE": "영수증번호 SYN-DUP-7781",
        "AF_SCANNER_METADATA_MISMATCH": "스캔본/촬영메타 불일치",
    }
    text = label_map.get(scenario["scenario_id"], scenario["name_ko"][:18])
    font = safe_font(max(18, int(out.width * 0.022)))
    # 흰색 패치 + 약한 회색 경계 + 검은 텍스트로 실제 문서 편집 흔적을 단순화해 마스크 학습 가능하게 한다.
    draw.rectangle(box, fill=(252, 252, 248), outline=(80, 80, 80), width=2)
    draw.text((box[0] + 8, box[1] + 4), text, fill=(15, 15, 15), font=font)
    mask_draw.rectangle(box, fill=255)
    return out, mask


def write_excel(path: Path, records: list[dict[str, Any]]) -> None:
    """NO/AF derivative index를 Excel로 저장한다."""

    path.parent.mkdir(parents=True, exist_ok=True)
    wb = Workbook()
    ws = wb.active
    ws.title = "real_image_redteam"
    headers = [
        "dataset_id", "prefix", "label_family", "document_type_guess", "capture_profile", "scenario_id",
        "scenario_name_ko", "local_image_path", "mask_path", "source_dataset_id", "source_url", "source_page_url",
        "privacy_review_status", "redistribution_status", "metadata_json",
    ]
    ws.append(headers)
    for rec in records:
        ws.append([rec.get(h, "") for h in headers])
    for col in ws.columns:
        ws.column_dimensions[col[0].column_letter].width = min(max(max(len(str(c.value or "")) for c in col) + 2, 12), 80)
    wb.save(path)


def generate_real_image_redteam_dataset(source_root: Path, output_root: Path, max_sources: int = 8, variants_per_source: int = 6) -> dict[str, Any]:
    """실제 공개 후보에서 privacy-safe NO/AF derivative 데이터셋을 생성한다."""

    manifest_path = source_root / "manifests" / "public_image_candidate_manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    source_records = manifest.get("records", [])[:max_sources]
    scenarios = build_redteam_scenarios()
    profiles = ["scanner_flatbed_300dpi", "scanner_adf_200dpi", "smartphone_topdown", "smartphone_oblique", "mobile_scan_app"]
    rng = random.Random(20260604)
    records: list[dict[str, Any]] = []
    no_count = 0
    af_count = 0

    for source_index, source_record in enumerate(source_records, start=1):
        source_image = Image.open(source_root / source_record["local_image_path"]).convert("RGB")
        page = fit_to_page(source_image)
        for profile in profiles[:2]:  # 스캐너 제출본을 반드시 생성한다.
            no_count += 1
            dataset_id = f"NO_REAL_DERIVED_{no_count:04d}"
            image = apply_capture_profile(page, profile, rng)
            rel = Path("images") / "NO" / f"{dataset_id}.png"
            meta = metadata_for("NO", dataset_id, source_record, profile)
            save_png_with_metadata(image, output_root / rel, meta)
            records.append({
                "dataset_id": dataset_id,
                "prefix": "NO",
                "label_family": "normal_real_derived_quarantine",
                "document_type_guess": source_record.get("document_type_guess", ""),
                "capture_profile": profile,
                "scenario_id": "NO_REAL_PUBLIC_DERIVATIVE",
                "scenario_name_ko": "공개 실제 후보 기반 정상 derivative",
                "local_image_path": rel.as_posix(),
                "mask_path": "",
                "source_dataset_id": source_record.get("dataset_id"),
                "source_url": source_record.get("source_url"),
                "source_page_url": source_record.get("source_page_url"),
                "privacy_review_status": "derived_quarantine_requires_manual_pii_review",
                "redistribution_status": "unknown_requires_source_review",
                "metadata_json": json.dumps(meta, ensure_ascii=False, sort_keys=True),
            })
        selected = [scenarios[(source_index + offset) % len(scenarios)] for offset in range(variants_per_source)]
        # 핵심 사용자 요청 항목은 초반 source에 강제로 포함한다.
        if source_index == 1:
            force_ids = ["AF_NAME_ALTERATION", "AF_VISIT_DATE_ALTERATION", "AF_DIAGNOSIS_TO_HIGH_VALUE", "AF_EXPENSIVE_DRUG_INSERTION", "AF_TOTAL_AMOUNT_INFLATION", "AF_SCANNER_METADATA_MISMATCH"]
            selected = [next(row for row in scenarios if row["scenario_id"] == sid) for sid in force_ids]
        for scenario_index, scenario in enumerate(selected):
            af_count += 1
            dataset_id = f"AF_REAL_DERIVED_{af_count:04d}"
            profile = profiles[(source_index + scenario_index) % len(profiles)]
            base = apply_capture_profile(page, profile, rng)
            tampered, mask = overlay_tamper(base, scenario, scenario_index)
            rel = Path("images") / "AF" / f"{dataset_id}.png"
            mask_rel = Path("masks") / "AF" / f"{dataset_id}_MASK.png"
            meta = metadata_for("AF", dataset_id, source_record, profile, scenario)
            save_png_with_metadata(tampered, output_root / rel, meta)
            save_png_with_metadata(mask.convert("RGB"), output_root / mask_rel, {"fds_dataset_id": dataset_id, "mask_for": rel.as_posix(), "scenario_id": scenario["scenario_id"]})
            records.append({
                "dataset_id": dataset_id,
                "prefix": "AF",
                "label_family": "adversarial_synthetic_from_real_candidate",
                "document_type_guess": source_record.get("document_type_guess", ""),
                "capture_profile": profile,
                "scenario_id": scenario["scenario_id"],
                "scenario_name_ko": scenario["name_ko"],
                "local_image_path": rel.as_posix(),
                "mask_path": mask_rel.as_posix(),
                "source_dataset_id": source_record.get("dataset_id"),
                "source_url": source_record.get("source_url"),
                "source_page_url": source_record.get("source_page_url"),
                "privacy_review_status": "derived_quarantine_requires_manual_pii_review",
                "redistribution_status": "unknown_requires_source_review",
                "metadata_json": json.dumps(meta, ensure_ascii=False, sort_keys=True),
            })

    output_root.mkdir(parents=True, exist_ok=True)
    summary = {
        "manifest_version": "insurance-fds-real-image-redteam-v1",
        "created_at": now_iso(),
        "source_manifest": manifest_path.as_posix(),
        "safety_notice_ko": "실제 공개 후보 기반 derivative는 개인정보/저작권 검토 전 quarantine이다. AF는 탐지용 synthetic overlay/mask이며 실제 위조물 복제가 아니다.",
        "no_count": no_count,
        "af_count": af_count,
        "scenario_catalog": scenarios,
        "records": records,
    }
    (output_root / "manifests").mkdir(parents=True, exist_ok=True)
    (output_root / "indexes").mkdir(parents=True, exist_ok=True)
    (output_root / "manifests" / "real_image_redteam_manifest.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2, sort_keys=True), encoding="utf-8")
    (output_root / "indexes" / "real_image_redteam_index.json").write_text(json.dumps(records, ensure_ascii=False, indent=2, sort_keys=True), encoding="utf-8")
    write_excel(output_root / "indexes" / "real_image_redteam_index.xlsx", records)
    return {"no_count": no_count, "af_count": af_count, "records": len(records)}


def parse_args() -> argparse.Namespace:
    """CLI 인자를 파싱한다."""

    parser = argparse.ArgumentParser(description="Generate Korean insurance FDS redteam derivatives from public real image candidates.")
    parser.add_argument("--source-root", type=Path, default=Path("data/insurance-fds-generated/public-real-candidates-v1-curated"))
    parser.add_argument("--output-root", type=Path, default=Path("data/insurance-fds-generated/real-image-redteam-v1"))
    parser.add_argument("--max-sources", type=int, default=8)
    parser.add_argument("--variants-per-source", type=int, default=6)
    return parser.parse_args()


def main() -> None:
    """CLI entrypoint."""

    args = parse_args()
    result = generate_real_image_redteam_dataset(args.source_root, args.output_root, args.max_sources, args.variants_per_source)
    print(json.dumps({"output_root": str(args.output_root), **result}, ensure_ascii=False))


if __name__ == "__main__":
    main()
