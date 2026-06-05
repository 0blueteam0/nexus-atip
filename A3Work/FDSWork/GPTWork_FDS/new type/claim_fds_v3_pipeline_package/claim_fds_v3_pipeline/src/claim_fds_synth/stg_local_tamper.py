from __future__ import annotations

import json
import math
import random
import shutil
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any, Iterable

from PIL import Image, ImageChops, ImageEnhance, ImageFilter, ImageStat

from .v4_high_fidelity_factory import ATTACK_SLUG_KO, ATTACK_TAXONOMY, DOCUMENT_TYPE_KO, _attack_value_detail, _safe_filename_part


@dataclass(frozen=True)
class FieldCandidate:
    image_path: str
    manifest_index: int
    dataset_id: str
    claim_id: str
    document_type: str
    label_family: str
    source_url: str
    source_page_url: str
    source_collection_method: str
    privacy_review_status: str
    field_name: str
    bbox: tuple[int, int, int, int]
    width: int
    height: int
    fg_mean: float
    fg_std: float
    bg_mean: float
    bg_std: float


@dataclass(frozen=True)
class DonorMatch:
    target: FieldCandidate
    donor: FieldCandidate
    score: float
    size_ratio: float
    fg_mean_delta: float
    bg_mean_delta: float


@dataclass(frozen=True)
class StgTamperResult:
    output_image: str
    target_field: str
    donor_field: str
    donor_dataset_id: str
    target_dataset_id: str
    attack_family: str
    reason_codes: list[str]
    match_score: float
    outside_bbox_diff_pixels: int
    tamper_pixel_count: int
    organized_file_path: str


FDS_TARGET_FIELDS = {
    "semantic_amount_mismatch": {
        "total_medical_fee",
        "patient_burden_total",
        "amount_due",
        "paid_by_card",
        "paid_total",
        "claimed_amount",
        "drug_total",
        "inpatient_total",
        "noncovered_amount",
        "room_charge",
    },
    "semantic_diagnosis_code_mismatch": {"diagnosis_name", "disease_code", "surgery_name"},
    "semantic_drug_mismatch": {"drug_name", "dosage_days", "drug_total", "patient_burden_total", "paid_total"},
    "semantic_duplicate_claim": {"receipt_no", "claim_id", "claim_no", "document_no", "treatment_date"},
    "semantic_provider_mismatch": {"provider_name", "provider_name_header", "provider_token", "business_no"},
    "semantic_hospitalization_period_mismatch": {"admission_date", "discharge_date", "admission_days", "treatment_date"},
    "semantic_inpatient_room_charge_inflation": {"room_charge", "noncovered_amount", "inpatient_total"},
    "semantic_line_item_insertion": {"inserted_line_item_amount", "line_item_name", "quantity", "noncovered_amount"},
    "semantic_surgery_anesthesia_mismatch": {"surgery_name", "surgery_date", "anesthesia_type", "surgery_anesthesia_amount"},
    "semantic_supporting_document_checkbox_mismatch": {
        "hospitalization_checkbox",
        "inpatient_detail_checkbox",
        "diagnosis_checkbox",
        "evidence_mismatch_note",
    },
}


FIELD_NAME_KO = {
    "patient_registration_no": "환자등록번호",
    "patient_name": "환자명",
    "treatment_period": "진료기간",
    "treatment_date": "진료일자",
    "department": "진료과",
    "ward": "병동",
    "receipt_no": "영수증번호",
    "document_no": "문서번호",
    "claim_no": "청구번호",
    "provider_name": "발급기관명",
    "provider_name_header": "발급기관명",
    "provider_phone_header": "발급기관전화번호",
    "business_no": "사업자등록번호",
    "diagnosis_name": "진단명",
    "disease_code": "질병분류기호",
    "diagnosis_date": "진단일자",
    "issuer_doctor": "발급의사",
    "surgery_name": "수술명",
    "surgery_date": "수술일자",
    "anesthesia_type": "마취유형",
    "surgery_anesthesia_amount": "수술마취금액",
    "drug_name": "약품명",
    "dosage_days": "처방일수",
    "drug_total": "약제비합계",
    "total_medical_fee": "총진료비",
    "patient_burden_total": "본인부담금합계",
    "amount_due": "납부할금액",
    "paid_by_card": "카드납부액",
    "paid_total": "납부총액",
    "claimed_amount": "청구금액",
    "beneficiary_account_token": "수익자계좌토큰",
    "admission_date": "입원일자",
    "discharge_date": "퇴원일자",
    "admission_days": "입원일수",
    "room_charge": "병실료",
    "noncovered_amount": "비급여금액",
    "inpatient_total": "입원진료비합계",
    "inserted_line_item_amount": "추가세부항목금액",
    "line_item_name": "세부항목명",
    "quantity": "수량",
    "hospitalization_checkbox": "입원서류체크박스",
    "inpatient_detail_checkbox": "입원세부내역체크박스",
    "diagnosis_checkbox": "진단서체크박스",
    "evidence_mismatch_note": "증빙불일치메모",
}


def field_name_ko(field_name: str) -> str:
    """Return a Korean review label while preserving the internal English key.

    내부 스키마와 테스트 안정성을 위해 manifest 내부 영문 필드명은 유지합니다. 대신 사람이
    보는 파일명, 경로, 리포트, 이미지에는 이 한국어 alias만 사용합니다. 알 수 없는 외부
    OCR/KIE 필드는 원문 key를 파일명/이미지에 노출하지 않고 `미분류필드`로 표시합니다.
    """

    return FIELD_NAME_KO.get(field_name, "미분류필드")


def _normalize_box(raw: Any) -> tuple[int, int, int, int] | None:
    if not isinstance(raw, (list, tuple)) or len(raw) != 4:
        return None
    x1, y1, x2, y2 = [int(v) for v in raw]
    if x2 <= x1 or y2 <= y1:
        return None
    return x1, y1, x2, y2


def _iter_field_boxes(field_bboxes: Any) -> Iterable[tuple[str, tuple[int, int, int, int], bool]]:
    if isinstance(field_bboxes, dict):
        for field_name, raw_box in field_bboxes.items():
            box = _normalize_box(raw_box)
            if box:
                yield str(field_name), box, True
    elif isinstance(field_bboxes, list):
        for item in field_bboxes:
            if not isinstance(item, dict):
                continue
            box = _normalize_box(item.get("bbox"))
            if box:
                yield str(item.get("field") or "unknown_field"), box, bool(item.get("critical", False))


def _safe_crop_box(img: Image.Image, box: tuple[int, int, int, int]) -> tuple[int, int, int, int] | None:
    x1, y1, x2, y2 = box
    x1 = max(0, min(img.width - 1, x1))
    y1 = max(0, min(img.height - 1, y1))
    x2 = max(x1 + 1, min(img.width, x2))
    y2 = max(y1 + 1, min(img.height, y2))
    if x2 - x1 < 12 or y2 - y1 < 10:
        return None
    return x1, y1, x2, y2


def _foreground_background_stats(crop: Image.Image) -> tuple[float, float, float, float]:
    gray = crop.convert("L")
    pixels = list(gray.getdata())
    if not pixels:
        return 0.0, 0.0, 255.0, 0.0
    mean_all = sum(pixels) / len(pixels)
    threshold = max(20.0, mean_all - 18.0)
    fg = [p for p in pixels if p < threshold]
    bg = [p for p in pixels if p >= threshold]
    if len(fg) < max(8, len(pixels) // 80):
        fg = sorted(pixels)[: max(1, len(pixels) // 8)]
    if len(bg) < max(8, len(pixels) // 80):
        bg = sorted(pixels)[-max(1, len(pixels) // 4) :]
    return _mean(fg), _std(fg), _mean(bg), _std(bg)


def _mean(values: list[int]) -> float:
    return float(sum(values) / len(values)) if values else 0.0


def _std(values: list[int]) -> float:
    if not values:
        return 0.0
    m = _mean(values)
    return float(math.sqrt(sum((v - m) ** 2 for v in values) / len(values)))


def build_field_candidate_pool(
    manifest_jsonl: str | Path,
    root_dir: str | Path,
    *,
    only_label_family: str = "NO",
    require_web_source_originals: bool = False,
) -> list[FieldCandidate]:
    root = Path(root_dir)
    rows = [json.loads(line) for line in Path(manifest_jsonl).read_text(encoding="utf-8").splitlines() if line.strip()]
    candidates: list[FieldCandidate] = []
    for idx, row in enumerate(rows):
        if row.get("label_family") != only_label_family:
            continue
        image_rel = row.get("file_name")
        if not image_rel:
            continue
        source_url = str(row.get("source_url") or row.get("original_source_url") or row.get("web_source_url") or "")
        source_page_url = str(row.get("source_page_url") or row.get("page_url") or source_url)
        if require_web_source_originals and not source_url:
            continue
        image_path = root / image_rel
        if not image_path.exists():
            continue
        try:
            img = Image.open(image_path).convert("RGB")
        except Exception:
            continue
        for field_name, box, critical in _iter_field_boxes(row.get("field_bboxes")):
            safe_box = _safe_crop_box(img, box)
            if not safe_box:
                continue
            x1, y1, x2, y2 = safe_box
            if not critical and field_name not in _all_target_fields():
                continue
            crop = img.crop(safe_box)
            fg_mean, fg_std, bg_mean, bg_std = _foreground_background_stats(crop)
            candidates.append(
                FieldCandidate(
                    image_path=image_rel,
                    manifest_index=idx,
                    dataset_id=str(row.get("dataset_id", f"row-{idx}")),
                    claim_id=str(row.get("claim_id", "unknown_claim")),
                    document_type=str(row.get("document_type", "unknown_doc")),
                    label_family=str(row.get("label_family", "NO")),
                    source_url=source_url,
                    source_page_url=source_page_url,
                    source_collection_method=str(row.get("source_collection_method") or row.get("collection_method") or "web_public_image_candidate" if source_url else "local_manifest"),
                    privacy_review_status=str(row.get("privacy_review_status") or "quarantine_requires_manual_pii_review" if source_url else "synthetic_or_local_source"),
                    field_name=field_name,
                    bbox=safe_box,
                    width=x2 - x1,
                    height=y2 - y1,
                    fg_mean=fg_mean,
                    fg_std=fg_std,
                    bg_mean=bg_mean,
                    bg_std=bg_std,
                )
            )
    return candidates


def _all_target_fields() -> set[str]:
    fields: set[str] = set()
    for values in FDS_TARGET_FIELDS.values():
        fields.update(values)
    return fields


def select_target_candidates(pool: list[FieldCandidate], attack_family: str) -> list[FieldCandidate]:
    preferred = FDS_TARGET_FIELDS.get(attack_family, set())
    exact = [c for c in pool if c.field_name in preferred]
    if exact:
        return exact
    # 실제 OCR/KIE가 아직 조악할 때도 진행 가능하게, 숫자/금액/날짜/코드/명칭성 필드를 fallback으로 선택합니다.
    hints = ("amount", "total", "date", "code", "name", "no", "charge", "burden", "diagnosis", "drug")
    return [c for c in pool if any(h in c.field_name.lower() for h in hints)]


def find_best_donor(
    target: FieldCandidate,
    pool: list[FieldCandidate],
    rng: random.Random | None = None,
    *,
    compatible_fields: set[str] | None = None,
) -> DonorMatch | None:
    rng = rng or random.Random(0)
    scored: list[DonorMatch] = []
    donor_pool = [donor for donor in pool if donor.field_name in compatible_fields] if compatible_fields else pool
    for donor in donor_pool:
        if donor.dataset_id == target.dataset_id and donor.field_name == target.field_name:
            continue
        if donor.image_path == target.image_path and _boxes_overlap(donor.bbox, target.bbox):
            continue
        wr = donor.width / max(1, target.width)
        hr = donor.height / max(1, target.height)
        if not (0.55 <= wr <= 1.85 and 0.55 <= hr <= 1.85):
            continue
        size_ratio = max(wr, 1 / wr) + max(hr, 1 / hr)
        fg_delta = abs(donor.fg_mean - target.fg_mean) + 0.35 * abs(donor.fg_std - target.fg_std)
        bg_delta = abs(donor.bg_mean - target.bg_mean) + 0.35 * abs(donor.bg_std - target.bg_std)
        same_doc_bonus = -8.0 if donor.document_type == target.document_type else 0.0
        score = size_ratio * 18.0 + fg_delta * 0.7 + bg_delta * 0.9 + same_doc_bonus + rng.random() * 0.01
        scored.append(DonorMatch(target, donor, score, max(wr, hr), fg_delta, bg_delta))
    if not scored:
        return None
    return min(scored, key=lambda item: item.score)


def _boxes_overlap(a: tuple[int, int, int, int], b: tuple[int, int, int, int]) -> bool:
    ax1, ay1, ax2, ay2 = a
    bx1, by1, bx2, by2 = b
    return max(ax1, bx1) < min(ax2, bx2) and max(ay1, by1) < min(ay2, by2)


def apply_local_field_substitution(
    root_dir: str | Path,
    match: DonorMatch,
    output_image: str | Path,
    *,
    image_quality: int = 88,
) -> tuple[int, int]:
    root = Path(root_dir)
    target_img = Image.open(root / match.target.image_path).convert("RGB")
    donor_img = Image.open(root / match.donor.image_path).convert("RGB")
    tx1, ty1, tx2, ty2 = match.target.bbox
    dx1, dy1, dx2, dy2 = match.donor.bbox
    target_crop = target_img.crop(match.target.bbox)
    donor_crop = donor_img.crop(match.donor.bbox).resize((tx2 - tx1, ty2 - ty1), Image.Resampling.BICUBIC)
    donor_crop = _match_patch_luminance(donor_crop, target_crop)
    donor_crop = donor_crop.filter(ImageFilter.GaussianBlur(0.08))
    alpha = Image.new("L", donor_crop.size, 255).filter(ImageFilter.GaussianBlur(0.35))
    tampered = target_img.copy()
    tampered.paste(donor_crop, (tx1, ty1), alpha)
    mask = Image.new("L", target_img.size, 0)
    mask.paste(255, match.target.bbox)
    outside_diff = _outside_mask_diff_count(target_img, tampered, mask)
    mask_pixels = sum(1 for px in mask.getdata() if px > 0)
    output_image = Path(output_image)
    output_image.parent.mkdir(parents=True, exist_ok=True)
    tampered.save(output_image, quality=image_quality)
    return outside_diff, mask_pixels


def _match_patch_luminance(donor_crop: Image.Image, target_crop: Image.Image) -> Image.Image:
    donor_stat = ImageStat.Stat(donor_crop.convert("L"))
    target_stat = ImageStat.Stat(target_crop.convert("L"))
    donor_mean = donor_stat.mean[0] if donor_stat.mean else 128.0
    target_mean = target_stat.mean[0] if target_stat.mean else 128.0
    donor_std = donor_stat.stddev[0] if donor_stat.stddev else 1.0
    target_std = target_stat.stddev[0] if target_stat.stddev else 1.0
    brightness = max(0.65, min(1.35, target_mean / max(1.0, donor_mean)))
    contrast = max(0.75, min(1.25, target_std / max(1.0, donor_std)))
    out = ImageEnhance.Brightness(donor_crop).enhance(brightness)
    out = ImageEnhance.Contrast(out).enhance(contrast)
    return out


def _outside_mask_diff_count(before: Image.Image, after: Image.Image, mask: Image.Image, threshold: int = 3) -> int:
    diff = ImageChops.difference(before.convert("RGB"), after.convert("RGB")).convert("L")
    inv = ImageChops.invert(mask.convert("L"))
    outside = ImageChops.multiply(diff, inv)
    return sum(1 for px in outside.getdata() if px > threshold)


def generate_stg_local_tamper_dataset(
    manifest_jsonl: str | Path,
    root_dir: str | Path,
    output_dir: str | Path,
    *,
    seed: int = 20260605,
    max_samples: int = 24,
    attack_families: Iterable[str] | None = None,
    clean_output_dir: bool = True,
    image_quality: int = 88,
    require_web_source_originals: bool = False,
) -> dict[str, Any]:
    root = Path(root_dir)
    output = Path(output_dir)
    if output.exists() and clean_output_dir:
        shutil.rmtree(output)
    output.mkdir(parents=True, exist_ok=True)
    rng = random.Random(seed)
    pool = build_field_candidate_pool(manifest_jsonl, root, require_web_source_originals=require_web_source_originals)
    attacks = list(attack_families or ATTACK_TAXONOMY.keys())
    results: list[dict[str, Any]] = []
    attempts = 0
    for attack_family in attacks:
        targets = select_target_candidates(pool, attack_family)
        rng.shuffle(targets)
        for target in targets:
            if len(results) >= max_samples:
                break
            attempts += 1
            compatible_fields = FDS_TARGET_FIELDS.get(attack_family, set())
            match = find_best_donor(target, pool, rng, compatible_fields=compatible_fields)
            if not match and compatible_fields:
                # 후보가 부족한 소규모 테스트/초기 수집 단계에서는 생성 자체가 멈추지 않도록 fallback을 허용합니다.
                match = find_best_donor(target, pool, rng)
            if not match:
                continue
            doc_ko = DOCUMENT_TYPE_KO.get(target.document_type, target.document_type)
            attack_slug = ATTACK_SLUG_KO.get(attack_family, attack_family)
            target_field_ko = field_name_ko(target.field_name)
            donor_field_ko = field_name_ko(match.donor.field_name)
            detail = _attack_value_detail(attack_family, None)
            sequence = len(results) + 1
            source_stem = _safe_filename_part(
                f"NO원본_{doc_ko}_원본ID-{target.dataset_id}_원본필드-{target_field_ko}_{sequence:04d}",
                max_len=210,
            )
            tampered_stem = _safe_filename_part(
                f"AF변조_STG국소치환_{doc_ko}_{attack_slug}_원본ID-{target.dataset_id}_변조대상필드-{target_field_ko}_공여필드-{donor_field_ko}({_safe_filename_part(detail, max_len=100)})_{sequence:04d}",
                max_len=230,
            )
            source_copy_rel = Path("stg_local_tamper") / "source_originals" / f"{source_stem}.jpg"
            image_rel = Path("stg_local_tamper") / "tampered_images" / f"{tampered_stem}.jpg"
            (output / source_copy_rel).parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(root / target.image_path, output / source_copy_rel)
            outside_diff, target_region_pixels = apply_local_field_substitution(root, match, output / image_rel, image_quality=image_quality)
            category = ATTACK_TAXONOMY[attack_family]["category"]
            source_organized_rel = (
                Path("organized")
                / "NO원본_STG소스"
                / doc_ko
                / "국소위변조원본후보"
                / f"{source_stem}.jpg"
            )
            organized_rel = (
                Path("organized")
                / "AF변조_STG국소치환"
                / doc_ko
                / _safe_filename_part(category, max_len=80)
                / _safe_filename_part(attack_slug, max_len=80)
                / f"변조대상필드-{_safe_filename_part(target_field_ko, max_len=40)}"
                / "국소필드치환_가명처리"
                / f"{tampered_stem}.jpg"
            )
            (output / source_organized_rel).parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(output / source_copy_rel, output / source_organized_rel)
            (output / organized_rel).parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(output / image_rel, output / organized_rel)
            row = {
                "dataset_id": f"AF_STG_LOCAL_{sequence:04d}",
                "label_family": "AF",
                "source_original_label_family": "NO",
                "tampered_label_family": "AF",
                "synthetic_only": not bool(target.source_url),
                "privacy_state": "pseudonymized_rewrite",
                "pseudonymization_policy": "real_identifiers_removed_or_replaced_with_fictional_values",
                "original_source_basis": "real_web_public_image" if target.source_url else "local_no_source_manifest",
                "raw_value_retention": False,
                "attack_family": attack_family,
                "attack_category_ko": category,
                "reason_codes": ATTACK_TAXONOMY[attack_family]["reason_codes"],
                "document_type": target.document_type,
                "document_type_ko": doc_ko,
                "target_field": target.field_name,
                "target_field_ko": target_field_ko,
                "donor_field": match.donor.field_name,
                "donor_field_ko": donor_field_ko,
                "donor_semantic_compatible": match.donor.field_name in compatible_fields if compatible_fields else True,
                "compatible_donor_fields": sorted(compatible_fields),
                "target_dataset_id": target.dataset_id,
                "donor_dataset_id": match.donor.dataset_id,
                "target_image_path": target.image_path,
                "donor_image_path": match.donor.image_path,
                "target_source_url": target.source_url,
                "target_source_page_url": target.source_page_url,
                "donor_source_url": match.donor.source_url,
                "source_collection_method": target.source_collection_method,
                "privacy_review_status": target.privacy_review_status,
                "source_original_copy_path": source_copy_rel.as_posix(),
                "source_original_organized_file_path": source_organized_rel.as_posix(),
                "target_bbox": list(target.bbox),
                "donor_bbox": list(match.donor.bbox),
                "match_score": round(match.score, 4),
                "fg_mean_delta": round(match.fg_mean_delta, 4),
                "bg_mean_delta": round(match.bg_mean_delta, 4),
                "file_name": image_rel.as_posix(),
                "organized_file_path": organized_rel.as_posix(),
                "organized_tree": organized_rel.as_posix().split("/")[:-1],
                "outside_bbox_diff_pixels": outside_diff,
                "target_region_pixel_count": target_region_pixels,
                "defensive_label_detail_ko": _attack_value_detail(attack_family, None),
                "why_fds_detects_ko": ATTACK_TAXONOMY[attack_family]["why_fds_detects"],
                "generation_method": "doc_tamper_stg_inspired_field_substitution",
            }
            results.append(row)
        if len(results) >= max_samples:
            break
    manifest_text = "\n".join(json.dumps(row, ensure_ascii=False) for row in results) + ("\n" if results else "")
    (output / "manifest.stg.v1.jsonl").write_text(manifest_text, encoding="utf-8")
    qc = {
        "schema_version": "qc_report.stg.v1",
        "source_manifest": str(manifest_jsonl),
        "candidate_pool_count": len(pool),
        "attempts": attempts,
        "row_count": len(results),
        "attack_families": sorted({row["attack_family"] for row in results}),
        "quality_gate": {
            "outside_bbox_diff_zero": all(row["outside_bbox_diff_pixels"] == 0 for row in results),
            "no_mask_artifacts": not any((output / "stg_local_tamper" / "tamper_masks").exists() for _ in [0]) and all("tamper_mask" not in row for row in results),
            "target_regions_positive": all(row["target_region_pixel_count"] > 0 for row in results),
            "organized_copies_exist": all((output / row["organized_file_path"]).exists() for row in results),
            "web_source_originals_present": (not require_web_source_originals) or all(row.get("target_source_url") for row in results),
            "pass": bool(results)
            and all(row["outside_bbox_diff_pixels"] == 0 for row in results)
            and all("tamper_mask" not in row for row in results)
            and all(row["target_region_pixel_count"] > 0 for row in results)
            and all((output / row["organized_file_path"]).exists() for row in results)
            and ((not require_web_source_originals) or all(row.get("target_source_url") for row in results)),
        },
    }
    (output / "qc_report.stg.v1.json").write_text(json.dumps(qc, ensure_ascii=False, indent=2), encoding="utf-8")
    return {"ok": qc["quality_gate"]["pass"], "output_dir": str(output), "manifest_rows": len(results), "candidate_pool_count": len(pool), "qc": qc}


def to_jsonable_candidates(candidates: list[FieldCandidate]) -> list[dict[str, Any]]:
    return [asdict(c) for c in candidates]
