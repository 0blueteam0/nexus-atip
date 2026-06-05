from __future__ import annotations

import argparse
import json
import shutil
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

import cv2
import numpy as np
from PIL import Image, ImageDraw


NEGATIVE_CONTEXT_TERMS = [
    "panda", "fubao", "pinimg", "pinterest", "profile", "avatar", "logo", "icon",
    "banner", "stock", "adobestock", "shutterstock", "gettyimages", "istockphoto",
    "wallpaper", "food", "recipe", "gourmet", "restaurant", "hotel", "playground",
    "beach", "travel", "tour", "alicdn", "youtube", "ytimg", "namu.wiki",
    "giuong", "drap", "sofa", "bed", "origami",
    "판다", "푸바오", "동물", "음식", "맛집", "여행", "관광", "배너", "로고", "프로필",
]

OCR_VISION_PASS_STATUS = "downloaded_quarantine_ocr_vision_pass"


@dataclass
class ProfileRow:
    candidate_id: str
    document_type_guess: str
    local_path: str
    page_url: str
    image_url: str
    width: int
    height: int
    edge_density: float
    horizontal_line_count: int
    vertical_line_count: int
    contour_box_count: int
    document_likelihood_score: float
    curation_suggestion: str
    context_reject_reason: str
    field_candidate_json_path: str


def load_manifest(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def detect_boxes(gray: np.ndarray) -> tuple[int, int, int, float, list[list[int]]]:
    blur = cv2.GaussianBlur(gray, (3, 3), 0)
    edges = cv2.Canny(blur, 80, 180)
    edge_density = float(np.mean(edges > 0))

    _, th = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    h, w = gray.shape[:2]
    h_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (max(20, w // 24), 1))
    v_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, max(20, h // 24)))
    h_lines = cv2.morphologyEx(th, cv2.MORPH_OPEN, h_kernel)
    v_lines = cv2.morphologyEx(th, cv2.MORPH_OPEN, v_kernel)

    h_contours, _ = cv2.findContours(h_lines, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    v_contours, _ = cv2.findContours(v_lines, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    grid = cv2.bitwise_or(h_lines, v_lines)
    contours, _ = cv2.findContours(grid, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    boxes: list[list[int]] = []
    for c in contours:
        x, y, bw, bh = cv2.boundingRect(c)
        if bw < 24 or bh < 12:
            continue
        if bw * bh < 500:
            continue
        if bw > w * 0.98 and bh > h * 0.98:
            continue
        boxes.append([int(x), int(y), int(x + bw), int(y + bh)])
    boxes = sorted(boxes, key=lambda b: (b[1], b[0]))[:80]
    return len(h_contours), len(v_contours), len(boxes), edge_density, boxes


def score_document(width: int, height: int, edge_density: float, h_lines: int, v_lines: int, boxes: int) -> float:
    aspect = width / max(1, height)
    score = 0.0
    if 0.45 <= aspect <= 2.4:
        score += 1.5
    if width >= 400 and height >= 250:
        score += 1.0
    if 0.025 <= edge_density <= 0.28:
        score += 1.5
    score += min(3.0, h_lines / 40)
    score += min(3.0, v_lines / 25)
    score += min(2.0, boxes / 20)
    return round(score, 3)


def row_context_reject_reason(row: dict[str, Any], *, allow_legacy_downloads: bool = False) -> str:
    """Return why a visually document-like candidate must stay rejected.

    이전 broad 수집 run은 OCR/비전 게이트 없이 raw_images에 이미지를 넣었기 때문에,
    단순 선/윤곽선 점수만으로는 호텔·음식·관광·로고 이미지가 문서 후보로 승격될 수 있습니다.
    기본값은 최신 수집기의 OCR/비전 통과 상태만 accept 대상으로 삼고, legacy raw 이미지는
    사람이 명시적으로 --allow-legacy-downloads를 줄 때만 느슨하게 프로파일링합니다.
    """

    collection_status = str(row.get("collection_status") or "")
    if not allow_legacy_downloads and collection_status != OCR_VISION_PASS_STATUS:
        return "legacy_or_unverified_download_not_ocr_vision_passed"
    hay = " ".join(str(row.get(k) or "") for k in ["title", "page_url", "image_url", "query"]).lower()
    if any(term in hay for term in NEGATIVE_CONTEXT_TERMS):
        return "negative_non_document_web_context"
    return ""


def make_debug_overlay(image_path: Path, boxes: list[list[int]], output_path: Path) -> None:
    img = Image.open(image_path).convert("RGB")
    draw = ImageDraw.Draw(img)
    for box in boxes[:60]:
        draw.rectangle(tuple(box), outline=(255, 0, 0), width=2)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    img.thumbnail((1000, 1000))
    img.save(output_path, quality=88)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--collection-dir", required=True)
    ap.add_argument("--min-score", type=float, default=4.2)
    ap.add_argument("--max-items", type=int, default=500)
    ap.add_argument(
        "--allow-legacy-downloads",
        action="store_true",
        help="Profile pre-gate broad downloads as accept candidates. Default keeps them rejected unless OCR/vision passed.",
    )
    args = ap.parse_args()

    collection_dir = Path(args.collection_dir)
    manifest = collection_dir / "real_web_source_candidates.manifest.jsonl"
    rows = load_manifest(manifest)
    out_dir = collection_dir / "document_profiles"
    out_dir.mkdir(parents=True, exist_ok=True)
    accepted_overlay_dir = out_dir / "accepted_overlays"
    if accepted_overlay_dir.exists():
        shutil.rmtree(accepted_overlay_dir)

    profiles: list[ProfileRow] = []
    accepted = 0
    for row in rows[: args.max_items]:
        local = row.get("local_path") or ""
        if not local:
            continue
        path = Path(local)
        if not path.is_absolute():
            path = Path.cwd() / path
        if not path.exists():
            continue
        try:
            arr = cv2.imdecode(np.fromfile(str(path), dtype=np.uint8), cv2.IMREAD_COLOR)
            if arr is None:
                continue
            gray = cv2.cvtColor(arr, cv2.COLOR_BGR2GRAY)
            h, w = gray.shape[:2]
            h_count, v_count, box_count, edge_density, boxes = detect_boxes(gray)
            score = score_document(w, h, edge_density, h_count, v_count, box_count)
            context_reject_reason = row_context_reject_reason(row, allow_legacy_downloads=args.allow_legacy_downloads)
            suggestion = (
                "accepted_document_like_quarantine"
                if score >= args.min_score and not context_reject_reason
                else "reject_or_low_priority_visual_noise"
            )
            field_path = out_dir / "field_candidates" / f"{row.get('candidate_id')}.field_candidates.json"
            field_path.parent.mkdir(parents=True, exist_ok=True)
            field_payload = {
                "candidate_id": row.get("candidate_id"),
                "source_image_path": str(path.as_posix()),
                "field_candidate_source": "opencv_table_line_contours_pre_ocr",
                "requires_ocr_kie_review": True,
                "candidate_bboxes_xyxy": boxes,
            }
            field_path.write_text(json.dumps(field_payload, ensure_ascii=False, indent=2), encoding="utf-8")
            if suggestion.startswith("accepted"):
                accepted += 1
                make_debug_overlay(path, boxes, out_dir / "accepted_overlays" / f"{row.get('candidate_id')}.jpg")
            profiles.append(ProfileRow(
                candidate_id=str(row.get("candidate_id")),
                document_type_guess=str(row.get("document_type_guess")),
                local_path=str(path.as_posix()),
                page_url=str(row.get("page_url") or ""),
                image_url=str(row.get("image_url") or ""),
                width=w,
                height=h,
                edge_density=round(edge_density, 5),
                horizontal_line_count=h_count,
                vertical_line_count=v_count,
                contour_box_count=box_count,
                document_likelihood_score=score,
                curation_suggestion=suggestion,
                context_reject_reason=context_reject_reason,
                field_candidate_json_path=str(field_path.as_posix()),
            ))
        except Exception:
            continue

    profile_path = out_dir / "real_web_document_profiles.jsonl"
    profile_path.write_text("\n".join(json.dumps(asdict(p), ensure_ascii=False) for p in profiles) + ("\n" if profiles else ""), encoding="utf-8")
    summary = {
        "ok": True,
        "profile_count": len(profiles),
        "accepted_document_like_count": accepted,
        "profile_manifest": str(profile_path.as_posix()),
        "accepted_overlay_dir": str((out_dir / "accepted_overlays").as_posix()),
        "field_candidate_dir": str((out_dir / "field_candidates").as_posix()),
    }
    (out_dir / "profile_summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
