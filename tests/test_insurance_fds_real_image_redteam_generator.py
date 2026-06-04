import importlib.util
import json
import sys
from pathlib import Path

from PIL import Image

MODULE_PATH = Path("scripts/insurance_fds_real_image_redteam_generator.py")
SPEC = importlib.util.spec_from_file_location("insurance_fds_real_image_redteam_generator", MODULE_PATH)
redteam = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
sys.modules["insurance_fds_real_image_redteam_generator"] = redteam
SPEC.loader.exec_module(redteam)


def test_should_define_tight_korean_redteam_scenarios():
    scenarios = redteam.build_redteam_scenarios()
    ids = {row["scenario_id"] for row in scenarios}

    assert "AF_NAME_ALTERATION" in ids
    assert "AF_VISIT_DATE_ALTERATION" in ids
    assert "AF_DIAGNOSIS_TO_HIGH_VALUE" in ids
    assert "AF_EXPENSIVE_DRUG_INSERTION" in ids
    assert "AF_TOTAL_AMOUNT_INFLATION" in ids
    assert "AF_DUPLICATE_CLAIM_REUSE" in ids
    assert "AF_SCANNER_METADATA_MISMATCH" in ids
    assert len(scenarios) >= 14
    assert all(row["document_targets"] for row in scenarios)
    assert all(row["fds_detector_features"] for row in scenarios)


def test_should_generate_no_and_af_derivatives_from_real_candidate(tmp_path):
    source_root = tmp_path / "source"
    image_dir = source_root / "images" / "NO"
    image_dir.mkdir(parents=True)
    img = Image.new("RGB", (640, 900), "white")
    img.save(image_dir / "NO_REAL_PUBLIC_IMAGE_0001.png")
    manifest = {
        "records": [
            {
                "dataset_id": "NO_REAL_PUBLIC_IMAGE_0001",
                "local_image_path": "images/NO/NO_REAL_PUBLIC_IMAGE_0001.png",
                "document_type_guess": "진료비계산서영수증_후보",
                "source_url": "https://example.com/receipt.png",
                "query": "진료비 영수증 실손보험",
            }
        ]
    }
    (source_root / "manifests").mkdir()
    (source_root / "manifests" / "public_image_candidate_manifest.json").write_text(json.dumps(manifest, ensure_ascii=False), encoding="utf-8")

    out = tmp_path / "out"
    result = redteam.generate_real_image_redteam_dataset(source_root, out, max_sources=1, variants_per_source=3)

    assert result["no_count"] >= 2
    assert result["af_count"] >= 3
    assert (out / "manifests" / "real_image_redteam_manifest.json").exists()
    assert (out / "indexes" / "real_image_redteam_index.xlsx").exists()
    assert list((out / "images" / "NO").glob("NO_REAL_DERIVED_*.png"))
    assert list((out / "images" / "AF").glob("AF_REAL_DERIVED_*.png"))
    assert list((out / "masks" / "AF").glob("AF_REAL_DERIVED_*_MASK.png"))


def test_should_insert_png_metadata(tmp_path):
    path = tmp_path / "sample.png"
    Image.new("RGB", (100, 100), "white").save(path)

    redteam.save_png_with_metadata(Image.open(path), path, {"fds_label": "NO", "capture_type": "scanner_flatbed_300dpi"})
    loaded = Image.open(path)

    assert loaded.info["fds_label"] == "NO"
    assert loaded.info["capture_type"] == "scanner_flatbed_300dpi"
