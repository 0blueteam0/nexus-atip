#!/usr/bin/env python
"""실손보험 청구서류 카메라 이미지 합성/증강 생성기.

이 스크립트는 앞 단계에서 만든 structured_json 합성 문서를 실제 모바일 제출 환경에
가깝게 이미지화한다. 실손보험 청구 서류는 PDF/스캔본뿐 아니라 휴대폰 카메라 촬영,
모바일 스캔 앱, 갤러리 재업로드 형태로 제출되는 경우가 많다. 따라서 FDS 관점에서는
문서 필드 값의 정합성뿐 아니라 촬영 환경 때문에 생기는 왜곡과 실제 위변조 흔적을
분리해서 학습할 수 있어야 한다.

핵심 설계:
1. structured_json의 필드와 bbox를 논리 좌표계 794x1123으로 렌더링한다.
2. 종이 문서를 책상/천/클립보드 같은 배경 위에 배치하고 회전, 조명, 그림자, 노이즈,
   JPEG 왕복 압축, 약한 블러를 적용한다.
3. AF 샘플은 forensic_annotations.mask_layers를 동일 좌표계로 투영해 mask PNG를 만든다.
4. Stable Diffusion/ComfyUI는 이 스크립트가 직접 실행하지 않고, 안전한 img2img/control
   contract를 산출한다. 실제 생성형 모델 연결 시에는 이 contract를 읽어 ComfyUI/Cloud에
   투입하면 된다.

안전 원칙:
- 실제 환자/기관 PII, 실제 로고, 실제 직인, 실제 서명을 만들지 않는다.
- AF는 범죄 재현용이 아니라 탐지 학습용 anomaly/mask/recipe 라벨이다.
- 모든 이미지와 마스크 파일명에 NO/AF prefix를 보존한다.
"""

from __future__ import annotations

import argparse
import io
import json
import random
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter, ImageFont

LOGICAL_PAGE_SIZE = (794, 1123)
RENDER_PAGE_SIZE = (1050, 1485)
CANVAS_SIZE = (1400, 1600)

CAMERA_PROFILES = [
    "smartphone_topdown",
    "smartphone_oblique",
    "mobile_scan_app",
    "low_light_gallery_reupload",
]
BACKGROUND_SURFACES = ["warm_wood_desk", "gray_office_table", "blue_fabric", "clipboard_board"]
SUBMISSION_CHANNELS = ["mobile_camera_upload", "mobile_scan_app", "mixed_camera_gallery"]


@dataclass(frozen=True)
class RenderedCameraItem:
    """manifest에 기록할 카메라 이미지 산출물 메타데이터."""

    item_id: str
    prefix: str
    document_type: str
    source_document_relative_path: str
    image_relative_path: str
    mask_relative_path: str
    camera_profile: str
    submission_channel: str
    degradation_recipe: dict[str, Any]
    tamper_labels: list[str]
    tamper_mask_policy: str
    mask_positive_pixel_count: int
    pii_status: str


def read_json(path: Path) -> dict[str, Any]:
    """UTF-8 JSON 파일을 읽는다."""

    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, data: Any) -> None:
    """UTF-8 pretty JSON을 저장한다."""

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2, sort_keys=True), encoding="utf-8")


def collect_structured_documents(source_root: Path, max_documents: int | None) -> list[Path]:
    """NO/AF structured_json을 균형 있게 수집한다.

    테스트와 실제 소량 생성 모두에서 AF가 누락되지 않도록 prefix별 목록을 만든 뒤
    round-robin으로 섞는다. max_documents는 최종 문서 개수 기준이다.
    """

    by_prefix = {
        "NO": sorted((source_root / "structured" / "NO").glob("NO_STRUCTURED_JSON_*.json")),
        "AF": sorted((source_root / "structured" / "AF").glob("AF_STRUCTURED_JSON_*.json")),
    }
    interleaved: list[Path] = []
    max_len = max(len(paths) for paths in by_prefix.values())
    for index in range(max_len):
        for prefix in ("NO", "AF"):
            if index < len(by_prefix[prefix]):
                interleaved.append(by_prefix[prefix][index])
    return interleaved[:max_documents] if max_documents else interleaved


def safe_get_font(size: int) -> ImageFont.ImageFont:
    """환경별 폰트 차이를 흡수하는 안전 폰트 로더."""

    candidates = [
        "C:/Windows/Fonts/malgun.ttf",
        "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/consola.ttf",
    ]
    for candidate in candidates:
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size=size)
    return ImageFont.load_default()


def value_for_field(fields: dict[str, Any], field_ref: str) -> str:
    """field_ref에서 synthetic field 값을 찾아 OCR 학습용 문자열로 변환한다."""

    key = field_ref.split(".")[-1]
    value = fields.get(key, "")
    if isinstance(value, int):
        return f"{value:,} KRW"
    return str(value)


def render_document_page(document: dict[str, Any]) -> Image.Image:
    """structured_json 한 건을 종이 문서 이미지로 렌더링한다."""

    page = Image.new("RGB", RENDER_PAGE_SIZE, "#fbfbf4")
    draw = ImageDraw.Draw(page)
    title_font = safe_get_font(34)
    body_font = safe_get_font(22)
    small_font = safe_get_font(17)

    prefix = document["document_label"]
    fields = document["fields"]
    document_type = fields.get("document_type", "unknown_document")

    draw.rectangle([24, 24, RENDER_PAGE_SIZE[0] - 24, RENDER_PAGE_SIZE[1] - 24], outline="#303030", width=2)
    draw.text((54, 44), f"SYNTHETIC INSURANCE CLAIM DOCUMENT / {document_type.upper()}", fill="#111111", font=title_font)
    draw.text((54, 92), f"label={prefix}  claim_group={document.get('claim_group_id')}  pii=synthetic_no_real_pii", fill="#666666", font=small_font)
    draw.line((54, 128, RENDER_PAGE_SIZE[0] - 54, 128), fill="#444444", width=2)

    scale_x = RENDER_PAGE_SIZE[0] / LOGICAL_PAGE_SIZE[0]
    scale_y = RENDER_PAGE_SIZE[1] / LOGICAL_PAGE_SIZE[1]
    for annotation in document.get("field_annotations", []):
        x, y, w, h = annotation["bbox"]
        rx, ry, rw, rh = int(x * scale_x), int(y * scale_y), int(w * scale_x), int(h * scale_y)
        field_ref = annotation["field_ref"]
        value = value_for_field(fields, field_ref)
        draw.rectangle([rx, ry, rx + rw, ry + rh], fill="#ffffff", outline="#d0d0d0")
        draw.text((rx + 8, ry + 4), f"{field_ref}: {value}", fill="#101010", font=body_font)

    # 세부 항목은 실제 진료비 세부산정내역서/영수증의 표 구조를 모델이 보게 하기 위한 합성 표다.
    table_top = 610
    draw.text((54, table_top - 34), "Synthetic line items", fill="#222222", font=body_font)
    draw.rectangle([54, table_top, RENDER_PAGE_SIZE[0] - 54, table_top + 170], outline="#333333", width=2)
    draw.line([54, table_top + 42, RENDER_PAGE_SIZE[0] - 54, table_top + 42], fill="#333333", width=1)
    draw.text((72, table_top + 10), "item_ref", fill="#222222", font=small_font)
    draw.text((520, table_top + 10), "benefit", fill="#222222", font=small_font)
    draw.text((700, table_top + 10), "amount", fill="#222222", font=small_font)
    for row_index, item in enumerate(fields.get("line_items", [])):
        y = table_top + 54 + row_index * 34
        draw.text((72, y), item.get("item_ref", ""), fill="#222222", font=small_font)
        draw.text((520, y), item.get("benefit_type", ""), fill="#222222", font=small_font)
        draw.text((700, y), f"{item.get('amount', 0):,}", fill="#222222", font=small_font)

    # 실제 직인/서명 대신 synthetic placeholder를 명확히 표시한다.
    draw.ellipse([760, 1130, 930, 1300], outline="#9a3333", width=4)
    draw.text((785, 1192), "SYN\nSEAL", fill="#9a3333", font=body_font, spacing=2)
    draw.text((54, 1370), "Generated for defensive FDS research only. No real patient, provider, seal, or signature.", fill="#777777", font=small_font)
    return page


def build_tamper_mask(document: dict[str, Any]) -> Image.Image:
    """논리 bbox 기반 AF tamper mask를 렌더링한다."""

    mask = Image.new("L", RENDER_PAGE_SIZE, 0)
    draw = ImageDraw.Draw(mask)
    scale_x = RENDER_PAGE_SIZE[0] / LOGICAL_PAGE_SIZE[0]
    scale_y = RENDER_PAGE_SIZE[1] / LOGICAL_PAGE_SIZE[1]
    for layer in document.get("forensic_annotations", {}).get("mask_layers", []):
        x, y, w, h = layer["bbox"]
        rx, ry, rw, rh = int(x * scale_x), int(y * scale_y), int(w * scale_x), int(h * scale_y)
        draw.rectangle([rx, ry, rx + rw, ry + rh], fill=255)
    return mask


def background_canvas(rng: random.Random, surface: str) -> Image.Image:
    """문서를 올려둘 배경 이미지를 생성한다."""

    colors = {
        "warm_wood_desk": (174, 133, 88),
        "gray_office_table": (154, 158, 160),
        "blue_fabric": (80, 94, 130),
        "clipboard_board": (188, 176, 145),
    }
    base = Image.new("RGB", CANVAS_SIZE, colors[surface])
    draw = ImageDraw.Draw(base)
    # 배경 질감은 탐지 모델이 문서 외부 배경에 과적합하지 않도록 약하게 랜덤화한다.
    for _ in range(180):
        x = rng.randint(0, CANVAS_SIZE[0] - 1)
        y = rng.randint(0, CANVAS_SIZE[1] - 1)
        delta = rng.randint(-20, 20)
        color = tuple(max(0, min(255, c + delta)) for c in colors[surface])
        draw.line((x, y, min(CANVAS_SIZE[0], x + rng.randint(20, 180)), y), fill=color, width=rng.randint(1, 2))
    return base


def jpeg_roundtrip(image: Image.Image, quality: int) -> Image.Image:
    """모바일 재업로드/메신저 압축을 흉내 내는 JPEG 왕복 변환."""

    buffer = io.BytesIO()
    image.save(buffer, format="JPEG", quality=quality, optimize=True)
    buffer.seek(0)
    return Image.open(buffer).convert("RGB")


def positive_pixels(mask: Image.Image) -> int:
    """마스크 양성 픽셀 개수를 계산한다.

    Pillow 14에서 getdata deprecation이 예정되어 있어 histogram 기반으로 계산한다.
    0번 bin은 배경 픽셀이므로 전체 픽셀 수에서 배경 픽셀 수를 빼면 양성 픽셀 수가 된다.
    """

    histogram = mask.convert("L").histogram()
    return mask.width * mask.height - histogram[0]


def compose_camera_capture(
    document_page: Image.Image,
    tamper_mask: Image.Image,
    rng: random.Random,
    profile: str,
    surface: str,
) -> tuple[Image.Image, Image.Image, dict[str, Any]]:
    """문서와 마스크에 동일한 촬영 변환을 적용해 카메라 제출 이미지를 만든다."""

    recipe = {
        "illumination": rng.choice(["soft_window_light", "fluorescent_office", "low_light_warm", "scan_app_flattened"]),
        "perspective": profile,
        "shadow": rng.choice(["left_edge_soft_shadow", "bottom_corner_shadow", "minimal_scan_shadow"]),
        "background_surface": surface,
        "compression_quality": rng.randint(58, 92),
        "motion_blur_radius": round(rng.choice([0, 0.4, 0.7, 1.1]), 2),
        "scanner_noise": rng.choice(["none", "low_iso_noise", "paper_texture_noise"]),
        "phone_capture_simulation": {
            "device_class": rng.choice(["budget_phone", "midrange_phone", "flagship_phone"]),
            "orientation": rng.choice(["portrait", "slight_clockwise", "slight_counterclockwise"]),
            "gallery_reupload": profile == "low_light_gallery_reupload",
        },
    }

    canvas = background_canvas(rng, surface)
    mask_canvas = Image.new("L", CANVAS_SIZE, 0)

    angle_by_profile = {
        "smartphone_topdown": rng.uniform(-2.5, 2.5),
        "smartphone_oblique": rng.uniform(-8.0, 8.0),
        "mobile_scan_app": rng.uniform(-0.8, 0.8),
        "low_light_gallery_reupload": rng.uniform(-5.5, 5.5),
    }
    scale_by_profile = {
        "smartphone_topdown": rng.uniform(0.82, 0.90),
        "smartphone_oblique": rng.uniform(0.76, 0.86),
        "mobile_scan_app": rng.uniform(0.88, 0.94),
        "low_light_gallery_reupload": rng.uniform(0.76, 0.88),
    }
    angle = angle_by_profile[profile]
    scale = scale_by_profile[profile]

    page = document_page.resize((int(document_page.width * scale), int(document_page.height * scale)))
    mask = tamper_mask.resize(page.size)

    # profile별 촬영 느낌: oblique는 약간 찌그러뜨리고, scan_app은 대비를 높인다.
    if profile == "smartphone_oblique":
        page = page.transform(page.size, Image.Transform.AFFINE, (1.0, 0.05, 0, 0.02, 1.0, 0), resample=Image.Resampling.BICUBIC)
        mask = mask.transform(mask.size, Image.Transform.AFFINE, (1.0, 0.05, 0, 0.02, 1.0, 0), resample=Image.Resampling.NEAREST)
    if profile == "mobile_scan_app":
        page = ImageEnhance.Contrast(page).enhance(1.22)
        page = ImageEnhance.Sharpness(page).enhance(1.35)
    if profile == "low_light_gallery_reupload":
        page = ImageEnhance.Brightness(page).enhance(0.82)

    page = page.rotate(angle, expand=True, fillcolor="#f8f8ee", resample=Image.Resampling.BICUBIC)
    mask = mask.rotate(angle, expand=True, fillcolor=0, resample=Image.Resampling.NEAREST)

    left = (CANVAS_SIZE[0] - page.width) // 2 + rng.randint(-30, 30)
    top = (CANVAS_SIZE[1] - page.height) // 2 + rng.randint(-25, 25)

    shadow = Image.new("RGBA", CANVAS_SIZE, (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_draw.rectangle([left + 18, top + 22, left + page.width + 18, top + page.height + 22], fill=(0, 0, 0, 70))
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=24))
    canvas = Image.alpha_composite(canvas.convert("RGBA"), shadow).convert("RGB")
    canvas.paste(page, (left, top))
    mask_canvas.paste(mask, (left, top))

    brightness = rng.uniform(0.88, 1.10)
    contrast = rng.uniform(0.92, 1.12)
    canvas = ImageEnhance.Brightness(canvas).enhance(brightness)
    canvas = ImageEnhance.Contrast(canvas).enhance(contrast)
    if recipe["motion_blur_radius"] > 0:
        canvas = canvas.filter(ImageFilter.GaussianBlur(radius=recipe["motion_blur_radius"]))
    canvas = jpeg_roundtrip(canvas, recipe["compression_quality"])

    # PNG 최종 산출이므로 JPEG 압축 흔적은 이미지 픽셀에 이미 반영되어 있고, 메타에는 quality를 남긴다.
    return canvas, mask_canvas, recipe


def tamper_labels_for(document: dict[str, Any]) -> list[str]:
    """AF 문서의 taxonomy 라벨을 수집한다."""

    labels: list[str] = []
    for mutation in document.get("label_summary", {}).get("mutations", []):
        tamper_type = mutation.get("tamper_type")
        if tamper_type:
            labels.append(tamper_type)
    if document.get("document_label") == "AF" and not labels:
        labels.append("AF_COMPRESSION_REGION_ANOMALY")
    return sorted(set(labels))


def emit_generative_contracts(output_root: Path) -> None:
    """Stable Diffusion/ComfyUI 연결을 위한 안전 contract와 차별화 전략을 저장한다."""

    contracts_dir = output_root / "generative_contracts"
    comfy_contract = {
        "contract_version": "insurance-fds-comfyui-img2img-control-v1",
        "live_generation_enabled": False,
        "purpose": "카메라 촬영 문서 이미지를 img2img/controlnet/inpaint로 다양화하기 위한 실행 전 계약. 기본값은 dry-run이다.",
        "recommended_workflows": [
            "SDXL img2img with low denoise for paper/camera realism",
            "ControlNet Canny/Lineart to preserve document layout",
            "Inpaint only background/shadow/noise regions; never synthesize real logos or real signatures",
        ],
        "positive_prompt_template": (
            "synthetic Korean private health insurance claim document photo, smartphone camera capture, "
            "paper on desk, realistic lighting, mild perspective distortion, OCR readable, no real PII, synthetic placeholders"
        ),
        "negative_prompt": (
            "real hospital logo, real doctor signature, real personal ID number, real patient name, "
            "counterfeit instruction, illegal forgery tutorial, unreadable text, hallucinated official seal"
        ),
        "control_inputs": {
            "source_image": "camera image PNG generated by scripts/insurance_fds_camera_image_generator.py",
            "tamper_mask": "AF mask PNG for supervised tamper localization or inpaint exclusion",
            "layout_lock": "Use low denoise 0.15-0.35 and ControlNet weight 0.65-0.95 to keep text boxes stable",
        },
        "parameter_grid": {
            "denoise_strength": [0.15, 0.22, 0.30, 0.35],
            "cfg_scale": [4.5, 6.0, 7.5],
            "camera_lora_policy": "only licensed or internally trained LoRA; no real hospital identity LoRA",
            "seed_policy": "record every seed in downstream manifest",
        },
        "outputs_required": ["image", "mask", "seed", "workflow_hash", "model_id", "license", "safety_review_status"],
    }
    strategy = {
        "strategy_version": "insurance-fds-image-data-moat-v1",
        "differentiation_point": (
            "정상/위조 여부만 학습하지 않고, 실제 모바일 제출 채널의 촬영 도메인 랜덤화와 "
            "필드/문서/이미지 포렌식 마스크를 결합해 OCR-KIE-FDS-세그멘테이션을 동시에 고도화한다."
        ),
        "data_moats": [
            "camera_capture_domain_randomization",
            "tamper_mask_supervision",
            "cross_document_consistency_labels",
            "submission_channel_metadata",
            "stable_diffusion_img2img_control_contracts",
            "ocr_roundtrip_quality_buckets",
        ],
        "safety_controls": [
            "no_real_pii",
            "no_real_hospital_logo_or_seal",
            "synthetic_namespace_required",
            "human_review_before_production_training",
            "model_license_record_required",
        ],
        "recommended_next_tools": [
            "ComfyUI local/cloud for SDXL img2img batches",
            "PaddleOCR or Tesseract for OCR roundtrip scoring",
            "LayoutLM/Donut/TrOCR style document AI baselines",
            "ELA/noise residual/copy-move feature extractors for AF image labels",
        ],
    }
    write_json(contracts_dir / "comfyui_img2img_control_contract.json", comfy_contract)
    write_json(contracts_dir / "stable_diffusion_camera_diversification_strategy.json", strategy)


def generate_camera_dataset(source_root: Path, output_root: Path, variants_per_document: int, max_documents: int | None, seed: int) -> dict[str, Any]:
    """카메라 이미지 데이터셋과 manifest를 생성한다."""

    rng = random.Random(seed)
    output_root.mkdir(parents=True, exist_ok=True)
    documents = collect_structured_documents(source_root, max_documents)
    items: list[RenderedCameraItem] = []

    for document_path in documents:
        document = read_json(document_path)
        prefix = document["document_label"]
        document_type = document["fields"].get("document_type", "unknown")
        page = render_document_page(document)
        base_mask = build_tamper_mask(document) if prefix == "AF" else Image.new("L", RENDER_PAGE_SIZE, 0)

        for variant_index in range(variants_per_document):
            profile = CAMERA_PROFILES[variant_index % len(CAMERA_PROFILES)] if variant_index < 2 else rng.choice(CAMERA_PROFILES)
            surface = rng.choice(BACKGROUND_SURFACES)
            image, mask, recipe = compose_camera_capture(page, base_mask, rng, profile, surface)
            source_stem = document_path.stem.replace("STRUCTURED_JSON", "CAMERA_IMAGE")
            item_id = f"{source_stem}_V{variant_index + 1:02d}"
            image_rel = Path("images") / prefix / f"{item_id}.png"
            mask_rel = Path("masks") / prefix / f"{item_id}_MASK.png"
            image_path = output_root / image_rel
            mask_path = output_root / mask_rel
            image_path.parent.mkdir(parents=True, exist_ok=True)
            mask_path.parent.mkdir(parents=True, exist_ok=True)
            image.save(image_path)
            mask.save(mask_path)

            items.append(
                RenderedCameraItem(
                    item_id=item_id,
                    prefix=prefix,
                    document_type=document_type,
                    source_document_relative_path=str(document_path.relative_to(source_root)).replace("\\", "/"),
                    image_relative_path=str(image_rel).replace("\\", "/"),
                    mask_relative_path=str(mask_rel).replace("\\", "/"),
                    camera_profile=profile,
                    submission_channel=rng.choice(SUBMISSION_CHANNELS),
                    degradation_recipe=recipe,
                    tamper_labels=tamper_labels_for(document),
                    tamper_mask_policy=(
                        "projected_from_structured_forensic_annotations" if prefix == "AF" else "blank_mask_for_normal_sample"
                    ),
                    mask_positive_pixel_count=positive_pixels(mask),
                    pii_status=document.get("pii_status", "synthetic_no_real_pii"),
                )
            )

    manifest = {
        "manifest_version": "insurance-fds-camera-image-manifest-v1",
        "source_root": str(source_root).replace("\\", "/"),
        "generation_seed": seed,
        "items": [item.__dict__ for item in items],
        "summary": {
            "document_count": len(documents),
            "image_count": len(items),
            "prefix_counts": {prefix: sum(1 for item in items if item.prefix == prefix) for prefix in ["NO", "AF"]},
            "camera_profiles": sorted({item.camera_profile for item in items}),
            "safety": "all samples are synthetic_no_real_pii and do not contain real hospital identity assets",
        },
    }
    write_json(output_root / "manifests" / "camera_image_manifest.json", manifest)
    emit_generative_contracts(output_root)
    return manifest


def parse_args() -> argparse.Namespace:
    """CLI 인자를 파싱한다."""

    parser = argparse.ArgumentParser(description="Generate camera-style images for insurance FDS synthetic documents.")
    parser.add_argument("--source-root", type=Path, default=Path("data/insurance-fds-generated/demo-v1"))
    parser.add_argument("--output", type=Path, default=Path("data/insurance-fds-generated/camera-v1"))
    parser.add_argument("--variants-per-document", type=int, default=3)
    parser.add_argument("--max-documents", type=int, default=None)
    parser.add_argument("--seed", type=int, default=20260604)
    return parser.parse_args()


def main() -> None:
    """CLI entrypoint."""

    args = parse_args()
    manifest = generate_camera_dataset(
        source_root=args.source_root,
        output_root=args.output,
        variants_per_document=args.variants_per_document,
        max_documents=args.max_documents,
        seed=args.seed,
    )
    print(json.dumps({"camera_manifest": str(args.output / "manifests" / "camera_image_manifest.json"), "items": len(manifest["items"])}, ensure_ascii=False))


if __name__ == "__main__":
    main()
