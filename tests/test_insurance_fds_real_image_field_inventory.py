import importlib.util
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw

MODULE_PATH = Path("scripts/insurance_fds_real_image_field_inventory.py")
SPEC = importlib.util.spec_from_file_location("insurance_fds_real_image_field_inventory", MODULE_PATH)
field_inventory = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
sys.modules["insurance_fds_real_image_field_inventory"] = field_inventory
SPEC.loader.exec_module(field_inventory)


def _make_fixture(root: Path) -> None:
    """실제 v1과 같은 manifest/index 구조의 작은 문서 이미지를 만든다."""

    image_dir = root / "images" / "NO"
    image_dir.mkdir(parents=True)
    image = Image.new("RGB", (600, 820), "#fbfbf6")
    draw = ImageDraw.Draw(image)
    draw.rectangle((60, 80, 540, 720), outline=(80, 80, 80), width=2)
    draw.text((95, 130), "TOTAL", fill=(20, 20, 20))
    draw.text((430, 130), "87,500", fill=(20, 20, 20))
    draw.text((95, 190), "DATE", fill=(20, 20, 20))
    draw.text((410, 190), "2026-05-28", fill=(20, 20, 20))
    draw.text((95, 250), "RECEIPT", fill=(20, 20, 20))
    draw.text((400, 250), "RX-1024", fill=(20, 20, 20))
    draw.line((80, 170, 520, 170), fill=(180, 180, 180), width=1)
    path = image_dir / "NO_REAL_DERIVED_0001.png"
    image.save(path)
    record = {
        "dataset_id": "NO_REAL_DERIVED_0001",
        "prefix": "NO",
        "document_type_guess": "진료비계산서영수증_후보",
        "local_image_path": "images/NO/NO_REAL_DERIVED_0001.png",
        "source_dataset_id": "NO_REAL_PUBLIC_IMAGE_0001",
        "source_url": "https://example.com/receipt.png",
        "source_page_url": "https://example.com/page",
        "privacy_review_status": "derived_quarantine_requires_manual_pii_review",
        "redistribution_status": "unknown_requires_source_review",
    }
    (root / "indexes").mkdir(parents=True)
    (root / "manifests").mkdir(parents=True)
    (root / "indexes" / "real_image_redteam_index.json").write_text(json.dumps([record], ensure_ascii=False), encoding="utf-8")
    (root / "manifests" / "real_image_redteam_manifest.json").write_text(
        json.dumps({"manifest_version": "insurance-fds-real-image-redteam-v1", "records": [record]}, ensure_ascii=False),
        encoding="utf-8",
    )


def test_should_build_field_inventory_before_any_tamper_generation(tmp_path):
    source_root = tmp_path / "real-image-redteam-v1"
    output_root = tmp_path / "field-inventory-v1"
    _make_fixture(source_root)

    result = field_inventory.build_field_inventory(source_root, output_root, max_no=1)

    assert result["document_count"] == 1
    assert result["field_candidate_count"] >= 3
    manifest_path = output_root / "manifests" / "field_inventory_manifest.json"
    document_path = output_root / "field-candidates" / "NO_REAL_DERIVED_0001.fields.json"
    overlay_path = output_root / "overlays" / "NO_REAL_DERIVED_0001.fields.png"
    review_path = output_root / "review-queue" / "NO_REAL_DERIVED_0001.review.json"
    assert manifest_path.exists()
    assert document_path.exists()
    assert overlay_path.exists()
    assert review_path.exists()

    document = json.loads(document_path.read_text(encoding="utf-8"))
    assert document["dataset_id"] == "NO_REAL_DERIVED_0001"
    assert document["image_width"] == 600
    assert document["image_height"] == 820
    assert document["document_type_guess"] == "진료비계산서영수증_후보"
    assert document["coordinate_system"] == "paired_no_image_pixel_xyxy"
    assert document["inventory_policy"]["tamper_generation_allowed_without_field_inventory"] is False
    assert document["inventory_policy"]["requires_field_value_before_tamper"] is True

    fields = document["fields"]
    assert fields
    for field in fields:
        assert field["field_id"].startswith("NO_REAL_DERIVED_0001_FIELD_")
        assert len(field["bbox_xyxy"]) == 4
        assert field["bbox_xyxy"][0] < field["bbox_xyxy"][2]
        assert field["bbox_xyxy"][1] < field["bbox_xyxy"][3]
        assert field["bbox_source"] in {"ocr_token", "vision_manual", "pixel_text_region"}
        assert field["field_family"] in {
            "amount_candidate",
            "date_candidate",
            "receipt_number_candidate",
            "name_candidate",
            "diagnosis_candidate",
            "unknown_text_candidate",
        }
        assert "value_text" in field
        assert field["value_status"] in {"ocr_extracted", "manual_review_required", "vision_review_required"}
        assert field["tamper_eligibility"] in {"eligible_after_value_confirmation", "blocked_until_value_confirmed"}
        assert field["evidence"]["paired_no_dataset_id"] == "NO_REAL_DERIVED_0001"


def test_should_block_pinpoint_tamper_when_field_value_is_not_confirmed():
    unconfirmed_field = {
        "field_id": "NO_REAL_DERIVED_0001_FIELD_0001",
        "field_family": "amount_candidate",
        "value_text": "",
        "value_status": "manual_review_required",
        "bbox_xyxy": [10, 10, 60, 30],
    }
    confirmed_field = {
        "field_id": "NO_REAL_DERIVED_0001_FIELD_0002",
        "field_family": "amount_candidate",
        "value_text": "87,500",
        "value_status": "ocr_extracted",
        "bbox_xyxy": [10, 10, 60, 30],
    }

    assert field_inventory.is_field_ready_for_tamper(unconfirmed_field) is False
    assert field_inventory.is_field_ready_for_tamper(confirmed_field) is True
