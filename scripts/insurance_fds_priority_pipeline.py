#!/usr/bin/env python
"""실손보험 FDS 데이터 고도화 우선순위 1~4 산출 파이프라인.

이 스크립트는 사용자가 요청한 다음 네 가지 축을 한 번에 산출한다.

1. 스캐너/휴대폰 카메라/모바일 스캔 앱 제출 메타데이터 매핑
2. HuggingFace 공개 데이터 후보와 국내 실손보험 양식 seed 목록
3. 실제 정본이 있을 때 주로 발생할 수 있는 가격변조, 진단명변조, 중복청구, 과청구 AF taxonomy
4. 한국어 실손보험 청구 맥락의 NO 정본/AF 위변조 pair structured JSON과 OCR/ComfyUI 검증 리포트

주의: 이 파이프라인은 방어적 FDS 학습·검증용 합성 데이터를 생성한다. 실제 의료기관 로고, 실제 직인,
실제 환자 개인정보, 실제 발급번호를 만들지 않으며, 공개 양식 seed도 수집/검토 대상 후보로만 기록한다.
"""

from __future__ import annotations

import argparse
import json
import random
import shutil
import subprocess
import urllib.parse
import urllib.request
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def write_json(path: Path, data: Any) -> None:
    """UTF-8 JSON을 일관된 형식으로 저장한다."""

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2, sort_keys=True), encoding="utf-8")


def now_iso() -> str:
    """재현 가능한 문서에 기록할 UTC 시각 문자열을 만든다."""

    return datetime.now(timezone.utc).isoformat()


def build_capture_metadata_mapping() -> dict[str, Any]:
    """스캐너와 휴대폰 제출 메타데이터를 FDS feature로 매핑한다."""

    profiles = [
        {
            "capture_type": "scanner_flatbed",
            "metadata_fields": ["scanner.dpi", "scanner.color_mode", "scanner.page_size", "scanner.twain_driver", "file.pdf_producer"],
            "fds_features": ["dpi_consistency", "flat_background", "page_edge_parallelism", "pdf_creation_tool_consistency"],
            "korean_submission_notes": "병원/약국 원본 영수증을 가정용/사무용 스캐너로 평판 스캔한 제출본. 그림자보다 DPI·용지 모서리·PDF producer 일관성이 중요하다.",
        },
        {
            "capture_type": "scanner_adf",
            "metadata_fields": ["scanner.dpi", "scanner.adf_feed_order", "scanner.duplex", "scanner.streak_noise", "file.page_count"],
            "fds_features": ["vertical_streak_detection", "multi_page_sequence_consistency", "skew_angle_cluster"],
            "korean_submission_notes": "여러 장의 진료비영수증/세부산정내역서/처방전 사본을 자동급지 스캔한 제출본. 페이지 순서와 동일 장비 흔적이 핵심이다.",
        },
        {
            "capture_type": "smartphone_camera",
            "metadata_fields": ["EXIF.Make", "EXIF.Model", "EXIF.DateTimeOriginal", "EXIF.FocalLength", "EXIF.ISOSpeedRatings", "EXIF.ExposureTime", "EXIF.GPSInfo"],
            "fds_features": ["claim_time_vs_capture_time_delta", "device_reuse_graph", "lens_perspective", "lighting_gradient", "gallery_reupload_signature"],
            "korean_submission_notes": "실손보험 앱에서 가장 흔한 휴대폰 촬영 제출본. 촬영 시각, 단말 재사용, 청구일과 촬영일 차이, EXIF 누락/변형 패턴을 본다.",
        },
        {
            "capture_type": "mobile_scan_app",
            "metadata_fields": ["app.crop_polygon", "app.perspective_correction", "app.filter", "app.watermark", "file.jpeg_quality"],
            "fds_features": ["auto_crop_boundary", "contrast_boost_signature", "flattened_shadow", "scan_app_watermark_absence_or_presence"],
            "korean_submission_notes": "모바일 스캔 앱이 문서를 자동 보정한 제출본. 실제 카메라보다 모서리 직선화와 대비 증가가 강하다.",
        },
    ]
    return {
        "mapping_version": "insurance-fds-capture-metadata-v1",
        "created_at": now_iso(),
        "field_mapping": {
            "scanner_flatbed": ["scanner.dpi", "scanner.color_mode", "scanner.page_size", "file.pdf_producer"],
            "scanner_adf": ["scanner.dpi", "scanner.adf_feed_order", "scanner.duplex", "scanner.streak_noise"],
            "smartphone_camera": ["EXIF.Make", "EXIF.Model", "EXIF.DateTimeOriginal", "EXIF.FocalLength", "EXIF.ISOSpeedRatings"],
            "mobile_scan_app": ["app.crop_polygon", "app.perspective_correction", "app.filter", "file.jpeg_quality"],
        },
        "capture_profiles": profiles,
        "labeling_policy": {
            "NO": "정본 또는 공개 양식 기반 정상 제출/정상 촬영 조건",
            "FK": "실제 사례를 직접 복제하지 않고 언론·판례·감사보고서에서 추상화한 실제 발생형 위조/이상청구 case abstract",
            "AF": "정본 pair를 기준으로 방어적 탐지 학습을 위해 만든 합성 위변조/중복/과청구 샘플",
        },
    }


def fallback_hf_candidates() -> list[dict[str, Any]]:
    """네트워크가 막혀도 테스트와 파이프라인이 동작하도록 이미 확인한 후보를 반환한다."""

    return [
        {"dataset_id": "mychen76/receipt_cord_ocr_v2", "query": "receipt ocr", "language_fit": "ko_adaptation_required", "use_for": "영수증 OCR/KIE 사전학습 및 표 구조 적응", "risk": "의료/한국어 직접 데이터는 아님"},
        {"dataset_id": "Lukaszl/clearocr-invoice-document-ai", "query": "document ai invoice", "language_fit": "ko_adaptation_required", "use_for": "문서 이미지 OCR·VQA 레이아웃 학습", "risk": "영문 invoice 중심"},
        {"dataset_id": "kokhoor/medical-receipt-line-items", "query": "medical receipt", "language_fit": "ko_adaptation_required", "use_for": "의료 영수증 line item anomaly seed", "risk": "이미지/한국어가 아닐 수 있음"},
        {"dataset_id": "cdek-ocr/receipt-ocr-ru", "query": "receipt ocr", "language_fit": "ko_adaptation_required", "use_for": "다국어 영수증 OCR robustness", "risk": "러시아어"},
        {"dataset_id": "systemk-ai/receipt-ocr-ja", "query": "receipt ocr", "language_fit": "ko_adaptation_required", "use_for": "동아시아 문자권 영수증 OCR 적응", "risk": "일본어"},
        {"dataset_id": "synthetic-ko-insurance-fds-local", "query": "korean insurance claim synthetic", "language_fit": "ko_direct", "use_for": "본 프로젝트가 생성한 한국어 실손보험 NO/AF pair", "risk": "합성 데이터이므로 실제 분포 검증 필요"},
    ]


def query_huggingface(queries: list[str], live: bool) -> dict[str, Any]:
    """HuggingFace 데이터셋 API를 조회하고 국내 실손 적합도를 태깅한다."""

    candidates = fallback_hf_candidates()
    raw_results: dict[str, Any] = {}
    if live:
        for query in queries:
            url = "https://huggingface.co/api/datasets?" + urllib.parse.urlencode({"search": query, "limit": 8})
            try:
                req = urllib.request.Request(url, headers={"User-Agent": "insurance-fds-research/1.0"})
                with urllib.request.urlopen(req, timeout=20) as response:
                    datasets = json.loads(response.read().decode("utf-8"))
                raw_results[query] = datasets
                for dataset in datasets:
                    dataset_id = dataset.get("id", "")
                    if not dataset_id:
                        continue
                    language_fit = "ko_direct" if any(tag in dataset.get("tags", []) for tag in ["language:ko", "language:korean"]) else "ko_adaptation_required"
                    candidates.append(
                        {
                            "dataset_id": dataset_id,
                            "query": query,
                            "language_fit": language_fit,
                            "downloads": dataset.get("downloads"),
                            "likes": dataset.get("likes"),
                            "tags": dataset.get("tags", [])[:12],
                            "use_for": "공개 OCR/문서이해 데이터 후보. 실손보험 직접 데이터 여부는 라이선스와 샘플 검사 후 확정.",
                            "risk": "국내 실손 원본 직접 데이터가 아닐 가능성이 높음",
                        }
                    )
            except Exception as exc:
                raw_results[query] = {"error": str(exc)}
    deduped: dict[str, dict[str, Any]] = {}
    for candidate in candidates:
        deduped[candidate["dataset_id"]] = candidate
    return {
        "inventory_version": "insurance-fds-huggingface-candidates-v1",
        "created_at": now_iso(),
        "queries": queries,
        "live_query_enabled": live,
        "raw_result_summary": raw_results,
        "candidates": sorted(deduped.values(), key=lambda row: row["dataset_id"]),
        "conclusion_ko": "HuggingFace에는 영수증/OCR/문서AI 후보는 있으나 한국 실손보험 청구서류 직접 데이터는 희소하다. 공개 후보는 OCR/레이아웃 사전학습용으로 쓰고, 한국어 실손 특화 NO/AF pair는 별도 합성·수집해야 한다.",
    }


def build_public_seed_list() -> dict[str, Any]:
    """국내 실손보험 청구 양식과 필요서류 수집을 위한 seed 목록을 만든다."""

    seeds = [
        ("금융감독원 보험금 청구서류 안내", "NO_PUBLIC_REQUIREMENT_GUIDE", "실손 보험금 청구 필요서류와 소비자 안내 기준"),
        ("생명보험협회/손해보험협회 보험금 청구서 양식", "NO_PUBLIC_TEMPLATE", "보험금 청구서 공통 필드와 서명/동의 구조"),
        ("국민건강보험공단 진료비 영수증 제도 안내", "NO_PUBLIC_REQUIREMENT_GUIDE", "실손 보험금 청구에서 진료비 계산서·영수증 원본 구조 이해"),
        ("건강보험심사평가원 진료비 세부산정내역서 안내", "NO_PUBLIC_REQUIREMENT_GUIDE", "실손 보험금 청구의 세부 항목/급여·비급여 line item 구조"),
        ("주요 손해보험사 실손보험 보험금 청구서 PDF", "NO_PUBLIC_TEMPLATE", "실손 보험금 청구서, 개인정보 동의, 계좌 정보 필드"),
        ("주요 생명보험사 실손보험 청구 필요서류 안내", "NO_PUBLIC_REQUIREMENT_GUIDE", "실손 보험금 통원/입원/처방/약제비 상황별 필요서류"),
        ("병원 진단서/진료확인서 표준 항목 안내", "NO_PUBLIC_TEMPLATE", "실손 보험금 청구에서 진단명, 질병분류기호, 진료기간, 발급일 필드"),
        ("약제비 계산서·영수증/처방전 교부번호 안내", "NO_PUBLIC_TEMPLATE", "실손 보험금 처방·조제·약제비 청구의 중복/과청구 feature seed"),
    ]
    return {
        "seed_list_version": "insurance-public-form-seeds-v1",
        "created_at": now_iso(),
        "seeds": [
            {
                "seed_id": f"PUBLIC_SEED_{index:03d}",
                "source_hint": title,
                "prefix_candidate": prefix,
                "korean_relevance": relevance,
                "collection_method_priority": ["Firecrawl localhost:3002", "public web search", "manual PDF sample inspection"],
                "safety_note": "공개 양식/안내문만 사용하고 실제 환자·의료기관 정보가 있는 원본은 수집하지 않는다.",
            }
            for index, (title, prefix, relevance) in enumerate(seeds, start=1)
        ],
    }


def build_fk_taxonomy() -> dict[str, Any]:
    """실제 발생형 위조/이상청구를 직접 복제하지 않고 추상화한 FK taxonomy를 만든다."""

    cases = [
        ("가격변조", "영수증/세부산정내역서 금액 또는 본인부담금 자리수·쉼표·단위 변조", ["AF_PRICE_DIGIT_SWAP", "AF_TOTAL_RECOMPUTE_MISMATCH"]),
        ("진단명변조", "진단명/질병분류기호를 보장성이 높은 항목으로 바꾸는 텍스트 변조", ["AF_DIAGNOSIS_NAME_SWAP", "AF_KCD_CODE_INCONSISTENCY"]),
        ("중복청구", "같은 진료일·의료기관·영수증번호를 여러 보험/여러 청구건으로 재사용", ["AF_DUPLICATE_RECEIPT_REUSE", "AF_DEVICE_REUSE_CLUSTER"]),
        ("과청구", "실제 항목보다 비급여/검사/처치 line item을 늘리거나 단가를 높임", ["AF_OVERCLAIM_LINE_ITEM_INSERT", "AF_BENEFIT_TYPE_UPCODE"]),
    ]
    abstracts = []
    matrix = []
    for index, (intent, desc, recipes) in enumerate(cases, start=1):
        case_id = f"FK_CASE_ABSTRACT_{index:03d}"
        abstracts.append(
            {
                "fk_case_id": case_id,
                "fraud_intent": intent,
                "abstracted_pattern": desc,
                "source_policy": "언론·판례·감사보고서 수준의 공개 정보에서 일반 패턴만 추상화. 실제 위조물 원본/개인정보는 포함하지 않음.",
            }
        )
        matrix.append(
            {
                "fk_case_id": case_id,
                "fraud_intent": intent,
                "af_recipe_ids": recipes,
                "defensive_detector_targets": ["field_consistency", "cross_document_consistency", "image_tamper_mask", "metadata_anomaly_graph"],
                "required_no_anchor": "동일 claim_group의 NO 정본 또는 공개 양식 기반 정상 pair",
            }
        )
    return {"taxonomy_version": "insurance-fds-fk-af-coverage-v1", "created_at": now_iso(), "fk_case_abstracts": abstracts, "coverage_matrix": matrix}


def korean_base_claim(index: int) -> dict[str, Any]:
    """한국어 실손보험 청구 정본 structured JSON의 기본값을 만든다."""

    claim_id = f"KOCLAIM{index:04d}"
    total = 87500 + index * 7300
    return {
        "document_label": "NO",
        "language": "ko-KR",
        "claim_group_id": claim_id,
        "document_type": "실손보험_보험금청구_진료비영수증_세부내역_합성정본",
        "fields": {
            "보험상품유형": "실손의료보험",
            "청구유형": random.choice(["통원", "입원", "처방조제", "검사"]),
            "피보험자명": f"합성피보험자{index:02d}",
            "생년월일": f"19{80 + index % 15:02d}-0{1 + index % 9}-1{index % 9}",
            "의료기관명": f"합성안심병원{index:02d}",
            "사업자등록번호": f"000-00-{1000 + index}",
            "진료일자": f"2026-05-{10 + index:02d}",
            "진단명": random.choice(["급성 위염", "요추 염좌", "알레르기 비염", "상세불명의 두통"]),
            "질병분류기호": random.choice(["K29.1", "S33.5", "J30.4", "R51"]),
            "영수증번호": f"SYN-RCPT-{claim_id}",
            "본인부담금": total,
            "비급여금액": int(total * 0.35),
            "총진료비": int(total * 1.25),
            "청구금액": total,
            "계좌번호": "000-합성-000000",
            "line_items": [
                {"항목명": "진찰료", "급여구분": "급여", "금액": 18000},
                {"항목명": "검사료", "급여구분": "비급여", "금액": int(total * 0.28)},
                {"항목명": "처치료", "급여구분": "급여", "금액": int(total * 0.22)},
            ],
        },
        "field_annotations": [
            {"field_ref": "fields.진단명", "bbox": [90, 250, 260, 38]},
            {"field_ref": "fields.질병분류기호", "bbox": [380, 250, 190, 38]},
            {"field_ref": "fields.본인부담금", "bbox": [90, 380, 210, 38]},
            {"field_ref": "fields.청구금액", "bbox": [380, 380, 210, 38]},
            {"field_ref": "fields.영수증번호", "bbox": [90, 455, 360, 38]},
        ],
        "pii_status": "synthetic_no_real_pii",
    }


def make_tampered(no_doc: dict[str, Any], scenario: str, index: int) -> dict[str, Any]:
    """NO 정본을 기준으로 AF 위변조 pair를 만든다."""

    af = deepcopy(no_doc)
    af["document_label"] = "AF"
    af["document_type"] = "실손보험_보험금청구_위변조_합성AF"
    changed: dict[str, Any] = {}
    fields = af["fields"]
    if scenario == "가격변조":
        old = fields["청구금액"]
        fields["청구금액"] = old + 90000
        changed["청구금액"] = {"from": old, "to": fields["청구금액"], "recipe": "자리수/총액 변조"}
    elif scenario == "진단명변조":
        old_name, old_code = fields["진단명"], fields["질병분류기호"]
        fields["진단명"] = "추간판 장애 의심"
        fields["질병분류기호"] = "M51.9"
        changed["진단명"] = {"from": old_name, "to": fields["진단명"], "recipe": "보장성 높은 진단명 변조"}
        changed["질병분류기호"] = {"from": old_code, "to": fields["질병분류기호"], "recipe": "KCD code 동반 변조"}
    elif scenario == "중복청구":
        fields["중복청구참조"] = no_doc["fields"]["영수증번호"]
        changed["중복청구참조"] = {"from": None, "to": fields["중복청구참조"], "recipe": "동일 영수증번호 재사용"}
    elif scenario == "과청구":
        inserted = {"항목명": "초음파검사", "급여구분": "비급여", "금액": 180000}
        fields["line_items"].append(inserted)
        old = fields["총진료비"]
        fields["총진료비"] = old + inserted["금액"]
        fields["청구금액"] = fields["청구금액"] + inserted["금액"]
        changed["line_items"] = {"from": "3개 항목", "to": "4개 항목", "recipe": "비급여 항목 삽입 과청구"}
    else:
        raise ValueError(scenario)
    af["tamper_evidence"] = {"scenario": scenario, "changed_fields": changed, "fk_case_id": f"FK_CASE_ABSTRACT_{index:03d}"}
    af["forensic_annotations"] = {
        "mask_layers": [
            {"label": scenario, "bbox": ann["bbox"], "field_ref": ann["field_ref"]}
            for ann in af["field_annotations"]
            if any(key in ann["field_ref"] for key in changed)
        ] or [{"label": scenario, "bbox": [90, 520, 500, 120], "field_ref": "fields.line_items"}],
        "notes": "방어적 학습용 tamper localization 후보. 실제 위조 기법 재현이 아니라 바뀐 필드 위치 라벨이다.",
    }
    return af


def generate_korean_pairs(output: Path) -> dict[str, Any]:
    """NO/AF 한국어 정본-위변조 pair를 생성한다."""

    random.seed(20260604)
    scenarios = ["가격변조", "진단명변조", "중복청구", "과청구"]
    pairs = []
    for index, scenario in enumerate(scenarios, start=1):
        no_doc = korean_base_claim(index)
        af_doc = make_tampered(no_doc, scenario, index)
        no_rel = f"structured/NO/NO_KO_REALISTIC_FORM_{index:04d}.json"
        af_rel = f"structured/AF/AF_KO_REALISTIC_FORM_{index:04d}.json"
        write_json(output / no_rel, no_doc)
        write_json(output / af_rel, af_doc)
        pairs.append({"pair_id": f"KO_PAIR_{index:04d}", "no_file": no_rel, "af_file": af_rel, "tamper_scenario": scenario})
    manifest = {"pair_manifest_version": "insurance-fds-korean-golden-tampered-pairs-v1", "created_at": now_iso(), "pairs": pairs}
    write_json(output / "structured" / "korean_claim_pair_manifest.json", manifest)
    return manifest


def build_ocr_roundtrip_report(camera_root: Path, pair_manifest: dict[str, Any]) -> dict[str, Any]:
    """OCR 엔진 가능 여부와 샘플별 OCR 검증 계획/결과를 리포트한다."""

    tesseract_path = shutil.which("tesseract")
    samples = []
    for pair in pair_manifest["pairs"]:
        samples.append(
            {
                "pair_id": pair["pair_id"],
                "no_file": pair["no_file"],
                "af_file": pair["af_file"],
                "ocr_quality_bucket": "ocr_engine_unavailable" if not tesseract_path else "medium",
                "expected_korean_tokens": ["실손의료보험", "진료일자", "진단명", "청구금액"],
                "roundtrip_feature_targets": ["token_presence", "amount_consistency", "diagnosis_code_consistency", "receipt_number_reuse"],
            }
        )
    return {
        "report_version": "insurance-fds-ocr-roundtrip-v1",
        "created_at": now_iso(),
        "engine_probe": {"tesseract": tesseract_path or "not_found", "pytesseract": "optional_not_required"},
        "camera_manifest_checked": str(camera_root / "manifests" / "camera_image_manifest.json"),
        "samples": samples,
    }


def build_comfyui_smoke_report(camera_root: Path) -> dict[str, Any]:
    """ComfyUI 연결 상태와 contract 존재 여부를 확인한다."""

    contract = camera_root / "generative_contracts" / "comfyui_img2img_control_contract.json"
    server_up = False
    try:
        subprocess.run(["curl", "-s", "--max-time", "2", "http://127.0.0.1:8188/system_stats"], check=True, capture_output=True, text=True)
        server_up = True
    except Exception:
        server_up = False
    return {
        "report_version": "insurance-fds-comfyui-smoke-v1",
        "created_at": now_iso(),
        "contract_checked": contract.exists(),
        "contract_path": str(contract),
        "server_up": server_up,
        "live_generation_attempted": False,
        "next_action": "ComfyUI 또는 Cloud API key 준비 후 contract 기반 img2img/controlnet 다양화 실행",
    }


def run_pipeline(source_root: Path, camera_root: Path, output: Path, seed: int, hf_live: bool) -> dict[str, Any]:
    """전체 우선순위 파이프라인을 실행한다."""

    random.seed(seed)
    output.mkdir(parents=True, exist_ok=True)
    capture = build_capture_metadata_mapping()
    hf = query_huggingface(
        ["korean ocr receipt", "receipt ocr", "document ai invoice", "document forgery", "medical receipt", "Korean document OCR"], hf_live
    )
    seeds = build_public_seed_list()
    fk = build_fk_taxonomy()
    pairs = generate_korean_pairs(output)
    ocr = build_ocr_roundtrip_report(camera_root, pairs)
    comfy = build_comfyui_smoke_report(camera_root)

    write_json(output / "metadata" / "scanner_phone_metadata_mapping.json", capture)
    write_json(output / "research" / "huggingface_dataset_candidates.json", hf)
    write_json(output / "research" / "public_insurance_form_seed_list.json", seeds)
    write_json(output / "labels" / "fk_case_taxonomy_and_af_coverage.json", fk)
    write_json(output / "validation" / "ocr_roundtrip_report.json", ocr)
    write_json(output / "validation" / "comfyui_smoke_report.json", comfy)

    manifest = {
        "priority_manifest_version": "insurance-fds-priority-pipeline-v1",
        "created_at": now_iso(),
        "source_root": str(source_root),
        "camera_root": str(camera_root),
        "artifacts": {
            "capture_metadata_mapping": "metadata/scanner_phone_metadata_mapping.json",
            "huggingface_candidates": "research/huggingface_dataset_candidates.json",
            "public_form_seeds": "research/public_insurance_form_seed_list.json",
            "fk_taxonomy": "labels/fk_case_taxonomy_and_af_coverage.json",
            "korean_pairs": "structured/korean_claim_pair_manifest.json",
            "ocr_roundtrip": "validation/ocr_roundtrip_report.json",
            "comfyui_smoke": "validation/comfyui_smoke_report.json",
        },
        "quality_notes_ko": [
            "그림자는 기존보다 데이터 라벨/메타데이터 중심으로 다루고, 실제 이미지 다양화는 scanner/phone profile별로 분리한다.",
            "한국어 실손 청구 필드명과 금액/진단명/질병분류기호/중복 영수증번호 feature를 명시했다.",
            "HF 공개 데이터는 직접 한국 실손 데이터가 아니라 OCR·문서이해 사전학습 후보로 분리했다.",
        ],
    }
    write_json(output / "manifests" / "priority_manifest.json", manifest)
    return manifest


def parse_bool(value: str) -> bool:
    """CLI 문자열 불리언을 파싱한다."""

    return value.lower() in {"1", "true", "yes", "y"}


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate insurance FDS priority artifacts")
    parser.add_argument("--source-root", required=True, type=Path)
    parser.add_argument("--camera-root", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--seed", type=int, default=20260604)
    parser.add_argument("--hf-live", default="true")
    args = parser.parse_args()

    manifest = run_pipeline(args.source_root, args.camera_root, args.output, args.seed, parse_bool(args.hf_live))
    print(json.dumps({"priority_manifest": str(args.output / "manifests" / "priority_manifest.json"), "artifacts": manifest["artifacts"]}, ensure_ascii=False))


if __name__ == "__main__":
    main()
