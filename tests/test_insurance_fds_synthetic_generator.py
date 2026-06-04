import json
import subprocess
import sys
from pathlib import Path


SCRIPT = Path("scripts/insurance_fds_synthetic_generator.py")


def run_generator(tmp_path: Path, *extra_args: str) -> Path:
    out_dir = tmp_path / "generated"
    cmd = [sys.executable, str(SCRIPT), "--output", str(out_dir), "--count-per-template", "1", "--seed", "77", *extra_args]
    result = subprocess.run(cmd, check=True, text=True, capture_output=True)
    assert "generated_manifest" in result.stdout
    return out_dir


def test_should_generate_no_and_af_artifacts_when_cli_runs(tmp_path):
    out_dir = run_generator(tmp_path)

    manifest_path = out_dir / "manifests" / "generated_manifest.json"
    label_standard_path = out_dir / "labels" / "insurance_fds_af_labeling_standard.json"
    assert manifest_path.exists()
    assert label_standard_path.exists()

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    prefixes = {item["prefix"] for item in manifest["items"]}
    methods = {item["generation_method"] for item in manifest["items"]}

    assert {"NO", "AF"}.issubset(prefixes)
    assert {"structured_json", "html_template", "svg_template", "diffusion_prompt_pack"}.issubset(methods)
    assert all(Path(item["relative_path"]).name.startswith(("NO_", "AF_")) for item in manifest["items"])


def test_should_include_detailed_af_labeling_taxonomy_and_qa_rules(tmp_path):
    out_dir = run_generator(tmp_path)
    label_standard = json.loads((out_dir / "labels" / "insurance_fds_af_labeling_standard.json").read_text(encoding="utf-8"))

    assert label_standard["label_standard_version"] == "insurance-fds-af-labels-v1"
    assert set(label_standard["label_levels"]) == {"document", "field", "image_forensic", "cross_document", "claim_behavior"}
    assert "AF_AMOUNT_INFLATION" in label_standard["tamper_taxonomy"]
    assert "AF_CROSSDOC_DATE_CONFLICT" in label_standard["tamper_taxonomy"]
    assert "synthetic_no_real_pii" in label_standard["privacy_rules"]["required_pii_status"]
    assert label_standard["qa_gates"]["minimum_required_annotations"] >= 8


def test_should_create_field_level_labels_with_masks_and_business_rules(tmp_path):
    out_dir = run_generator(tmp_path)
    manifest = json.loads((out_dir / "manifests" / "generated_manifest.json").read_text(encoding="utf-8"))
    af_items = [item for item in manifest["items"] if item["prefix"] == "AF" and item["generation_method"] == "structured_json"]
    assert af_items

    sample = json.loads((out_dir / af_items[0]["relative_path"]).read_text(encoding="utf-8"))
    assert sample["pii_status"] == "synthetic_no_real_pii"
    assert sample["document_label"] == "AF"
    assert sample["tamper_labels"]
    assert all("field_ref" in label and "evidence_type" in label and "severity" in label for label in sample["tamper_labels"])
    assert sample["business_rule_checks"]
    assert sample["forensic_annotations"]["mask_layers"]


def test_should_emit_reproducible_train_val_test_split(tmp_path):
    first = run_generator(tmp_path / "a")
    second = run_generator(tmp_path / "b")

    first_split = json.loads((first / "manifests" / "split_manifest.json").read_text(encoding="utf-8"))
    second_split = json.loads((second / "manifests" / "split_manifest.json").read_text(encoding="utf-8"))

    assert first_split == second_split
    assert set(first_split) == {"train", "val", "test"}
    assert sum(len(v) for v in first_split.values()) > 0
