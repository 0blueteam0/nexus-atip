#!/usr/bin/env python
"""한국 실손보험 FDS용 공개 이미지 후보 수집기.

이 스크립트는 사용자가 요청한 “실제 병원비/진료비/약제비/보험 청구 관련 이미지”를
합성 렌더링만으로 만들지 않고, 공개 웹 이미지 검색 결과에서 후보를 수집하기 위한
방어적 데이터 엔지니어링 도구다.

중요한 안전 원칙:
- 공개 웹 이미지에는 실제 성명, 생년월일, 병원명, 영수증번호 등 민감정보가 남아 있을 수 있다.
- 따라서 내려받은 이미지는 곧바로 학습 정본으로 확정하지 않고 quarantine 상태로 둔다.
- 파일명은 사용자의 규칙에 맞춰 정상 후보이므로 NO prefix를 붙이되,
  manifest에는 privacy_review_status=quarantine_requires_manual_pii_review를 강제한다.
- 재배포 가능성도 확인 전에는 unknown_requires_source_review로 둔다.
- 이 수집기는 FDS 방어/평가용 정상 문서 도메인 적응 후보를 만들기 위한 것이며,
  실제 위조 실행 방법이나 개인정보 복제를 목적으로 하지 않는다.
"""

from __future__ import annotations

import argparse
import html
import json
import mimetypes
import re
import time
import urllib.parse
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import requests
from PIL import Image, PngImagePlugin

try:
    from openpyxl import Workbook
except ImportError:  # pragma: no cover - dependency check path
    Workbook = None  # type: ignore[assignment]


@dataclass(frozen=True)
class DownloadResult:
    """다운로드 결과를 manifest에 기록하기 위한 작은 값 객체."""

    ok: bool
    relative_path: str
    bytes_written: int
    content_type: str
    error: str | None = None


def now_iso() -> str:
    """UTC ISO timestamp를 반환한다."""

    return datetime.now(timezone.utc).isoformat()


def build_korean_search_queries() -> list[str]:
    """한국 실손보험 청구 정상 문서 이미지 검색용 질의를 촘촘히 만든다."""

    base_terms = [
        "실손보험 영수증",
        "실손보험 제출서류",
        "실손보험 보험금 청구서",
        "실손보험 청구서류 영수증",
        "병원비 영수증 실손보험",
        "병원 영수증 실손보험",
        "진료비 영수증 실손보험",
        "진료비 계산서 영수증 실손보험",
        "진료비 세부산정내역서 실손보험",
        "진료비 세부내역서 보험 청구",
        "약제비 영수증 실손보험",
        "보험 약제비 영수증",
        "약국 영수증 보험 청구",
        "처방전 약제비 영수증 실손보험",
        "보험금 청구서 진료비 영수증",
        "통원확인서 진료비 영수증 보험 청구",
    ]
    modifiers = ["이미지", "양식", "샘플", "pdf", "jpg", "개인정보 삭제", "예시"]
    queries: list[str] = []
    for term in base_terms:
        queries.append(term)
        for modifier in modifiers[:3]:
            queries.append(f"{term} {modifier}")
    return list(dict.fromkeys(queries))


def infer_document_type(query: str, url: str) -> str:
    """검색어와 URL 문자열로 문서 유형을 보수적으로 추정한다."""

    text = f"{query} {url}".lower()
    if "약제" in text or "약국" in text or "pharmacy" in text or "처방" in text:
        return "약제비영수증_처방전_후보"
    if "세부" in text or "detail" in text:
        return "진료비세부산정내역서_후보"
    if "청구서" in text or "claim" in text:
        return "보험금청구서_후보"
    if "진료비" in text or "병원" in text or "hospital" in text or "receipt" in text:
        return "진료비계산서영수증_후보"
    return "한국실손보험제출서류_후보"


def extract_bing_image_candidates(html_text: str, query: str) -> list[dict[str, str]]:
    """Bing 이미지 검색 HTML에서 원본 이미지 후보 URL을 추출한다.

    Bing은 이미지 결과에 class=iusc와 m 속성 JSON을 넣는 경우가 많다. HTML 파서 의존성을
    줄이기 위해 정규식으로 m 속성을 꺼낸 뒤 JSON decode를 시도한다.
    """

    candidates: list[dict[str, str]] = []
    seen: set[str] = set()
    pattern = re.compile(r"class=\"iusc\"[^>]*?\sm=['\"](?P<meta>\{.*?\})['\"]", re.DOTALL)
    for match in pattern.finditer(html_text):
        raw_meta = html.unescape(match.group("meta"))
        try:
            meta = json.loads(raw_meta)
        except json.JSONDecodeError:
            continue
        image_url = meta.get("murl") or meta.get("imgurl")
        if not image_url or image_url in seen:
            continue
        seen.add(image_url)
        candidates.append(
            {
                "query": query,
                "image_url": image_url,
                "thumbnail_url": meta.get("turl", ""),
                "page_url": meta.get("purl", ""),
            }
        )
    return candidates


def search_bing_images(query: str, limit: int = 20) -> list[dict[str, str]]:
    """Bing 이미지 검색에서 후보 URL을 수집한다."""

    url = "https://www.bing.com/images/search?" + urllib.parse.urlencode({"q": query, "form": "HDRSC2", "first": "1"})
    response = requests.get(url, headers={"User-Agent": "Mozilla/5.0 insurance-fds-research/1.0"}, timeout=25)
    response.raise_for_status()
    return extract_bing_image_candidates(response.text, query=query)[:limit]


def safe_extension(content_type: str, url: str) -> str:
    """Content-Type 또는 URL에서 이미지 확장자를 결정한다."""

    guessed = mimetypes.guess_extension(content_type.split(";")[0].strip()) if content_type else None
    if guessed in {".jpg", ".jpeg", ".png", ".webp"}:
        return ".jpg" if guessed == ".jpeg" else guessed
    path_ext = Path(urllib.parse.urlparse(url).path).suffix.lower()
    if path_ext in {".jpg", ".jpeg", ".png", ".webp"}:
        return ".jpg" if path_ext == ".jpeg" else path_ext
    return ".jpg"


def add_png_metadata(path: Path, metadata: dict[str, Any]) -> None:
    """PNG 파일에 FDS synthetic metadata를 삽입한다."""

    image = Image.open(path).convert("RGB")
    png_info = PngImagePlugin.PngInfo()
    for key, value in metadata.items():
        png_info.add_text(str(key), json.dumps(value, ensure_ascii=False) if isinstance(value, (dict, list)) else str(value))
    image.save(path, pnginfo=png_info)


def normalize_to_png_with_metadata(path: Path, metadata: dict[str, Any]) -> Path:
    """다운로드 이미지를 PNG로 정규화하고 텍스트 메타데이터를 직접 삽입한다."""

    image = Image.open(path).convert("RGB")
    png_path = path.with_suffix(".png")
    png_info = PngImagePlugin.PngInfo()
    for key, value in metadata.items():
        png_info.add_text(str(key), json.dumps(value, ensure_ascii=False) if isinstance(value, (dict, list)) else str(value))
    image.save(png_path, pnginfo=png_info)
    if png_path != path:
        path.unlink(missing_ok=True)
    return png_path


def download_image(candidate: dict[str, str], output_root: Path, index: int) -> DownloadResult:
    """후보 이미지를 다운로드하고 synthetic FDS metadata를 파일에 삽입한다."""

    image_url = candidate["image_url"]
    try:
        response = requests.get(image_url, headers={"User-Agent": "Mozilla/5.0 insurance-fds-research/1.0"}, timeout=30)
        response.raise_for_status()
        content_type = response.headers.get("Content-Type", "")
        if "image" not in content_type.lower() and not re.search(r"\.(jpg|jpeg|png|webp)(\?|$)", image_url, re.I):
            return DownloadResult(False, "", 0, content_type, "not_image_content_type")
        ext = safe_extension(content_type, image_url)
        temp_rel = Path("images") / "NO" / f"NO_REAL_PUBLIC_IMAGE_{index:04d}{ext}"
        temp_path = output_root / temp_rel
        temp_path.parent.mkdir(parents=True, exist_ok=True)
        temp_path.write_bytes(response.content)

        metadata = {
            "fds_dataset_id": f"NO_REAL_PUBLIC_IMAGE_{index:04d}",
            "fds_prefix": "NO",
            "source_family": "public_web_image_candidate",
            "query": candidate.get("query", ""),
            "source_url": image_url,
            "source_page_url": candidate.get("page_url", ""),
            "privacy_review_status": "quarantine_requires_manual_pii_review",
            "redistribution_status": "unknown_requires_source_review",
            "capture_type": "unknown_public_web_image",
            "created_by": "insurance_fds_public_image_collector.py",
            "created_at": now_iso(),
        }
        final_path = normalize_to_png_with_metadata(temp_path, metadata)
        return DownloadResult(True, str(final_path.relative_to(output_root)).replace("\\", "/"), final_path.stat().st_size, content_type)
    except Exception as exc:  # noqa: BLE001 - manifest에 실패 사유 기록 목적
        return DownloadResult(False, "", 0, "", f"{type(exc).__name__}: {exc}")


def normalize_candidate_record(source: dict[str, str], index: int, relative_image_path: str) -> dict[str, Any]:
    """이미지 후보를 FDS manifest record로 정규화한다."""

    dataset_id = f"NO_REAL_PUBLIC_IMAGE_{index:04d}"
    capture_metadata = {
        "capture_type": "unknown_public_web_image",
        "metadata_inserted_into_file": True,
        "source_image_metadata_policy": "preserve_only_after_manual_review_if_needed",
        "synthetic_fds_metadata_policy": "inserted_as_png_text_chunks",
        "scanner_or_camera_truth": "unknown_public_web_candidate",
    }
    return {
        "dataset_id": dataset_id,
        "file_name": f"{dataset_id}.png",
        "prefix": "NO",
        "source_family": "public_web_image_candidate",
        "document_type_guess": infer_document_type(source.get("query", ""), source.get("image_url", "")),
        "query": source.get("query", ""),
        "source_url": source.get("image_url", ""),
        "source_page_url": source.get("page_url", ""),
        "thumbnail_url": source.get("thumbnail_url", ""),
        "local_image_path": relative_image_path,
        "privacy_review_status": "quarantine_requires_manual_pii_review",
        "redistribution_status": "unknown_requires_source_review",
        "fds_value": "한국 실손보험 정상 제출서류 이미지 도메인 적응 후보. 개인정보/저작권 검토 후만 학습 승격.",
        "capture_metadata": capture_metadata,
        "capture_metadata_json": json.dumps(capture_metadata, ensure_ascii=False, sort_keys=True),
        "label_policy": "NO candidate only after manual review; otherwise keep quarantine.",
    }


def write_json(path: Path, data: Any) -> None:
    """UTF-8 JSON을 저장한다."""

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2, sort_keys=True), encoding="utf-8")


def write_excel_index(path: Path, records: list[dict[str, Any]]) -> None:
    """수집 이미지 후보 manifest를 Excel로 정리한다."""

    if Workbook is None:
        raise RuntimeError("openpyxl is required to write Excel index. Install with: pip install openpyxl")
    path.parent.mkdir(parents=True, exist_ok=True)
    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "public_image_candidates"
    headers = [
        "dataset_id",
        "file_name",
        "prefix",
        "document_type_guess",
        "query",
        "source_url",
        "source_page_url",
        "local_image_path",
        "privacy_review_status",
        "redistribution_status",
        "fds_value",
        "capture_metadata_json",
    ]
    sheet.append(headers)
    for record in records:
        sheet.append([record.get(header, "") for header in headers])
    for column in sheet.columns:
        max_length = max(len(str(cell.value or "")) for cell in column)
        sheet.column_dimensions[column[0].column_letter].width = min(max(max_length + 2, 12), 80)
    workbook.save(path)


def collect_public_images(output_root: Path, max_queries: int, per_query: int, max_downloads: int, sleep_seconds: float) -> dict[str, Any]:
    """검색어 생성부터 다운로드, manifest/Excel 저장까지 수행한다."""

    queries = build_korean_search_queries()[:max_queries]
    output_root.mkdir(parents=True, exist_ok=True)
    candidates: list[dict[str, str]] = []
    search_errors: list[dict[str, str]] = []
    seen_urls: set[str] = set()

    for query in queries:
        try:
            for candidate in search_bing_images(query, limit=per_query):
                if candidate["image_url"] in seen_urls:
                    continue
                seen_urls.add(candidate["image_url"])
                candidates.append(candidate)
        except Exception as exc:  # noqa: BLE001 - 검색 실패 증거화
            search_errors.append({"query": query, "error": f"{type(exc).__name__}: {exc}"})
        time.sleep(sleep_seconds)

    records: list[dict[str, Any]] = []
    download_errors: list[dict[str, str]] = []
    download_index = 1
    for candidate in candidates:
        if len(records) >= max_downloads:
            break
        result = download_image(candidate, output_root=output_root, index=download_index)
        if result.ok:
            record = normalize_candidate_record(candidate, index=download_index, relative_image_path=result.relative_path)
            record["bytes_written"] = result.bytes_written
            record["source_content_type"] = result.content_type
            records.append(record)
            download_index += 1
        else:
            download_errors.append({"image_url": candidate.get("image_url", ""), "query": candidate.get("query", ""), "error": result.error or "unknown"})

    manifest = {
        "manifest_version": "insurance-fds-public-real-image-candidates-v1",
        "created_at": now_iso(),
        "safety_notice_ko": "공개 웹 이미지 후보는 실제 개인정보/저작권 위험이 있으므로 quarantine 상태다. 수동 PII 마스킹·출처 검토 전에는 학습 정본으로 확정하지 않는다.",
        "search_engine": "Bing Images HTML extraction; Google/Yandex should be used for manual cross-check when browser access permits.",
        "queries": queries,
        "candidate_count_before_download": len(candidates),
        "downloaded_count": len(records),
        "records": records,
        "search_errors": search_errors,
        "download_errors": download_errors[:100],
    }
    write_json(output_root / "manifests" / "public_image_candidate_manifest.json", manifest)
    write_excel_index(output_root / "indexes" / "public_image_candidate_index.xlsx", records)
    write_json(output_root / "indexes" / "public_image_candidate_index.json", records)
    return manifest


def parse_args() -> argparse.Namespace:
    """CLI 인자를 파싱한다."""

    parser = argparse.ArgumentParser(description="Collect Korean insurance-claim public image candidates for FDS quarantine review.")
    parser.add_argument("--output-root", type=Path, default=Path("data/insurance-fds-generated/public-real-candidates-v1"))
    parser.add_argument("--max-queries", type=int, default=8)
    parser.add_argument("--per-query", type=int, default=8)
    parser.add_argument("--max-downloads", type=int, default=24)
    parser.add_argument("--sleep-seconds", type=float, default=0.5)
    return parser.parse_args()


def main() -> None:
    """CLI entrypoint."""

    args = parse_args()
    manifest = collect_public_images(
        output_root=args.output_root,
        max_queries=args.max_queries,
        per_query=args.per_query,
        max_downloads=args.max_downloads,
        sleep_seconds=args.sleep_seconds,
    )
    print(json.dumps({"manifest": str(args.output_root / "manifests" / "public_image_candidate_manifest.json"), "downloaded_count": manifest["downloaded_count"]}, ensure_ascii=False))


if __name__ == "__main__":
    main()
