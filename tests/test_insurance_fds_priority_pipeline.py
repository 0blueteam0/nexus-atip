import json
import subprocess
import sys
from pathlib import Path


SCRIPT = Path("scripts/insurance_fds_priority_pipeline.py")
CAMERA_ROOT = Path("data/insurance-fds-generated/camera-v1")
SOURCE_ROOT = Path("data/insurance-fds-generated/demo-v1")


def run_priority_pipeline(tmp_path: Path) -> Path:
    out_dir = tmp_path / "priority-v1"
    cmd = [
        sys.executable,
        str(SCRIPT),
        "--source-root",
        str(SOURCE_ROOT),
        "--camera-root",
        str(CAMERA_ROOT),
        "--output",
        str(out_dir),
        "--seed",
        "20260604",
        "--hf-live",
        "false",
    ]
    result = subprocess.run(cmd, check=True, text=True, capture_output=True)
    assert "priority_manifest" in result.stdout
    return out_dir


def test_should_generate_scanner_phone_metadata_mapping(tmp_path):
    out_dir = run_priority_pipeline(tmp_path)
    mapping = json.loads((out_dir / "metadata" / "scanner_phone_metadata_mapping.json").read_text(encoding="utf-8"))

    assert mapping["mapping_version"] == "insurance-fds-capture-metadata-v1"
    assert {profile["capture_type"] for profile in mapping["capture_profiles"]} >= {"scanner_flatbed", "scanner_adf", "smartphone_camera", "mobile_scan_app"}
    for profile in mapping["capture_profiles"]:
        assert "metadata_fields" in profile
        assert "fds_features" in profile
        assert "korean_submission_notes" in profile
    assert "EXIF.DateTimeOriginal" in mapping["field_mapping"]["smartphone_camera"]
    assert "scanner.dpi" in mapping["field_mapping"]["scanner_flatbed"]


def test_should_generate_huggingface_dataset_candidates_and_public_seed_list(tmp_path):
    out_dir = run_priority_pipeline(tmp_path)
    hf = json.loads((out_dir / "research" / "huggingface_dataset_candidates.json").read_text(encoding="utf-8"))
    seeds = json.loads((out_dir / "research" / "public_insurance_form_seed_list.json").read_text(encoding="utf-8"))

    assert hf["inventory_version"] == "insurance-fds-huggingface-candidates-v1"
    assert hf["queries"]
    assert any("receipt" in candidate["dataset_id"].lower() for candidate in hf["candidates"])
    assert any(candidate["language_fit"] in {"ko_direct", "ko_adaptation_required"} for candidate in hf["candidates"])

    assert seeds["seed_list_version"] == "insurance-public-form-seeds-v1"
    assert len(seeds["seeds"]) >= 6
    assert {seed["prefix_candidate"] for seed in seeds["seeds"]} <= {"NO_PUBLIC_TEMPLATE", "NO_PUBLIC_REQUIREMENT_GUIDE"}
    assert all("실손" in seed["korean_relevance"] or "보험금" in seed["korean_relevance"] for seed in seeds["seeds"])


def test_should_generate_fk_taxonomy_and_af_coverage_matrix(tmp_path):
    out_dir = run_priority_pipeline(tmp_path)
    fk = json.loads((out_dir / "labels" / "fk_case_taxonomy_and_af_coverage.json").read_text(encoding="utf-8"))

    assert fk["taxonomy_version"] == "insurance-fds-fk-af-coverage-v1"
    categories = {case["fraud_intent"] for case in fk["fk_case_abstracts"]}
    assert {"가격변조", "진단명변조", "중복청구", "과청구"}.issubset(categories)
    for row in fk["coverage_matrix"]:
        assert row["fk_case_id"].startswith("FK_CASE_ABSTRACT_")
        assert row["af_recipe_ids"]
        assert row["defensive_detector_targets"]


def test_should_generate_korean_golden_and_tampered_pairs(tmp_path):
    out_dir = run_priority_pipeline(tmp_path)
    pairs = json.loads((out_dir / "structured" / "korean_claim_pair_manifest.json").read_text(encoding="utf-8"))

    assert pairs["pair_manifest_version"] == "insurance-fds-korean-golden-tampered-pairs-v1"
    assert pairs["pairs"]
    for pair in pairs["pairs"]:
        assert pair["no_file"].startswith("structured/NO/NO_KO_REALISTIC_FORM_")
        assert pair["af_file"].startswith("structured/AF/AF_KO_REALISTIC_FORM_")
        assert pair["tamper_scenario"] in {"가격변조", "진단명변조", "중복청구", "과청구"}
        no_doc = json.loads((out_dir / pair["no_file"]).read_text(encoding="utf-8"))
        af_doc = json.loads((out_dir / pair["af_file"]).read_text(encoding="utf-8"))
        assert no_doc["language"] == "ko-KR"
        assert af_doc["language"] == "ko-KR"
        assert no_doc["document_label"] == "NO"
        assert af_doc["document_label"] == "AF"
        assert af_doc["tamper_evidence"]["changed_fields"]


def test_should_generate_ocr_roundtrip_and_comfyui_smoke_reports(tmp_path):
    out_dir = run_priority_pipeline(tmp_path)
    ocr = json.loads((out_dir / "validation" / "ocr_roundtrip_report.json").read_text(encoding="utf-8"))
    comfy = json.loads((out_dir / "validation" / "comfyui_smoke_report.json").read_text(encoding="utf-8"))

    assert ocr["report_version"] == "insurance-fds-ocr-roundtrip-v1"
    assert ocr["samples"]
    assert all(sample["ocr_quality_bucket"] in {"ocr_engine_unavailable", "high", "medium", "low"} for sample in ocr["samples"])
    assert "tesseract" in ocr["engine_probe"]

    assert comfy["report_version"] == "insurance-fds-comfyui-smoke-v1"
    assert comfy["live_generation_attempted"] is False
    assert comfy["contract_checked"] is True
