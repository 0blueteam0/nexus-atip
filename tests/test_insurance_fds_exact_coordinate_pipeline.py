import importlib.util
import json
import sys
from pathlib import Path

from PIL import Image, ImageChops

MODULE_PATH = Path("scripts/insurance_fds_exact_coordinate_pipeline.py")
SPEC = importlib.util.spec_from_file_location("insurance_fds_exact_coordinate_pipeline", MODULE_PATH)
module = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
sys.modules["insurance_fds_exact_coordinate_pipeline"] = module
SPEC.loader.exec_module(module)


def _changed_bbox(no_image_path: Path, af_image_path: Path) -> list[int]:
    diff = ImageChops.difference(Image.open(no_image_path).convert("RGB"), Image.open(af_image_path).convert("RGB"))
    bbox = diff.getbbox()
    assert bbox is not None
    return list(bbox)


def _contains(outer: list[int], inner: list[int], padding: int = 8) -> bool:
    return (
        outer[0] - padding <= inner[0]
        and outer[1] - padding <= inner[1]
        and outer[2] + padding >= inner[2]
        and outer[3] + padding >= inner[3]
    )


def test_should_generate_af_by_overwriting_same_bbox_on_paired_no_image(tmp_path):
    out = tmp_path / "exact"

    result = module.generate_exact_coordinate_dataset(out, template_cases=2)

    assert result["version"] == "insurance-fds-field-pseudonymized-v3.2-exact-coordinate-overwrite"
    assert result["counts"]["NO"] > 0
    assert result["counts"]["AF"] > 0
    assert (out / "manifests" / "pair_manifest.json").exists()

    pair_manifest = json.loads((out / "manifests" / "pair_manifest.json").read_text(encoding="utf-8"))
    first_pair = pair_manifest["pairs"][0]
    no_field = json.loads((out / first_pair["no_field_json_path"]).read_text(encoding="utf-8"))
    af_field = json.loads((out / first_pair["af_field_json_path"]).read_text(encoding="utf-8"))
    evidence = af_field["tamper_evidence"][0]
    field_key = evidence["field_key"]

    assert af_field["paired_no_dataset_id"] == no_field["dataset_id"]
    assert af_field["source_lineage"]["paired_no_field_json_path"] == first_pair["no_field_json_path"]
    assert evidence["bbox"] == af_field["fields"][field_key]["bbox"]
    assert evidence["bbox"] == no_field["fields"][field_key]["bbox"]
    assert evidence["coordinate_policy"] == "same_bbox_as_paired_no_original_field"
    assert evidence["overlay_or_shifted_box_used"] is False

    changed = _changed_bbox(out / first_pair["no_image_path"], out / first_pair["af_image_path"])
    assert _contains(evidence["bbox"], changed, padding=12), {"bbox": evidence["bbox"], "changed": changed}


def test_should_validate_all_af_pairs_have_identical_no_and_af_field_coordinates(tmp_path):
    out = tmp_path / "exact"
    module.generate_exact_coordinate_dataset(out, template_cases=3)

    report = module.validate_exact_coordinate_pairs(out)

    assert report["checked_pairs"] > 0
    assert report["bbox_mismatch_count"] == 0
    assert report["missing_pair_count"] == 0
    assert report["pixel_diff_outside_bbox_count"] == 0
    assert (out / "validation" / "exact_coordinate_validation.json").exists()
