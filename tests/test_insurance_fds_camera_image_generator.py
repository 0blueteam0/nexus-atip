import json
import subprocess
import sys
from pathlib import Path

from PIL import Image


SCRIPT = Path("scripts/insurance_fds_camera_image_generator.py")
SOURCE_ROOT = Path("data/insurance-fds-generated/demo-v1")


def run_camera_generator(tmp_path: Path, *extra_args: str) -> Path:
    out_dir = tmp_path / "camera-v1"
    cmd = [
        sys.executable,
        str(SCRIPT),
        "--source-root",
        str(SOURCE_ROOT),
        "--output",
        str(out_dir),
        "--variants-per-document",
        "2",
        "--max-documents",
        "4",
        "--seed",
        "20260604",
        *extra_args,
    ]
    result = subprocess.run(cmd, check=True, text=True, capture_output=True)
    assert "camera_manifest" in result.stdout
    return out_dir


def test_should_generate_camera_style_pngs_and_masks_when_cli_runs(tmp_path):
    out_dir = run_camera_generator(tmp_path)

    manifest_path = out_dir / "manifests" / "camera_image_manifest.json"
    assert manifest_path.exists()
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))

    assert manifest["manifest_version"] == "insurance-fds-camera-image-manifest-v1"
    assert manifest["items"]
    assert {item["prefix"] for item in manifest["items"]} <= {"NO", "AF"}
    assert {"smartphone_topdown", "smartphone_oblique"}.issubset({item["camera_profile"] for item in manifest["items"]})

    for item in manifest["items"]:
        image_path = out_dir / item["image_relative_path"]
        mask_path = out_dir / item["mask_relative_path"]
        assert image_path.exists(), image_path
        assert mask_path.exists(), mask_path
        with Image.open(image_path) as img:
            assert img.format == "PNG"
            assert img.size[0] >= 900 and img.size[1] >= 900
        with Image.open(mask_path) as mask:
            assert mask.mode in {"L", "1"}
            assert mask.size[0] >= 900 and mask.size[1] >= 900


def test_should_record_rich_camera_degradation_and_submission_metadata(tmp_path):
    out_dir = run_camera_generator(tmp_path)
    manifest = json.loads((out_dir / "manifests" / "camera_image_manifest.json").read_text(encoding="utf-8"))

    required_keys = {
        "illumination",
        "perspective",
        "shadow",
        "background_surface",
        "compression_quality",
        "motion_blur_radius",
        "scanner_noise",
        "phone_capture_simulation",
    }
    for item in manifest["items"]:
        assert required_keys.issubset(item["degradation_recipe"])
        assert item["submission_channel"] in {"mobile_camera_upload", "mobile_scan_app", "mixed_camera_gallery"}
        assert item["pii_status"] == "synthetic_no_real_pii"
        assert item["source_document_relative_path"].startswith("structured/")


def test_should_emit_af_tamper_masks_for_af_camera_images(tmp_path):
    out_dir = run_camera_generator(tmp_path)
    manifest = json.loads((out_dir / "manifests" / "camera_image_manifest.json").read_text(encoding="utf-8"))
    af_items = [item for item in manifest["items"] if item["prefix"] == "AF"]
    assert af_items

    for item in af_items:
        assert item["tamper_mask_policy"] == "projected_from_structured_forensic_annotations"
        assert item["tamper_labels"]
        assert item["mask_positive_pixel_count"] > 0


def test_should_emit_stable_diffusion_control_contracts_without_live_generation(tmp_path):
    out_dir = run_camera_generator(tmp_path)
    workflow_path = out_dir / "generative_contracts" / "comfyui_img2img_control_contract.json"
    strategy_path = out_dir / "generative_contracts" / "stable_diffusion_camera_diversification_strategy.json"

    workflow = json.loads(workflow_path.read_text(encoding="utf-8"))
    strategy = json.loads(strategy_path.read_text(encoding="utf-8"))

    assert workflow["contract_version"] == "insurance-fds-comfyui-img2img-control-v1"
    assert workflow["live_generation_enabled"] is False
    assert "real hospital logo" in workflow["negative_prompt"]
    assert strategy["differentiation_point"]
    assert "camera_capture_domain_randomization" in strategy["data_moats"]
    assert "no_real_pii" in strategy["safety_controls"]
