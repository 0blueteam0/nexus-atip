from __future__ import annotations

import argparse
import hashlib
import json
import mimetypes
import re
import shutil
import urllib.error
import urllib.request
from datetime import datetime
from pathlib import Path
from typing import Any
from urllib.parse import unquote, urlparse

DOWNLOADABLE_SOURCE_CATEGORIES = {"blank_form_or_pdf"}
REAL_DOCUMENT_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".tif", ".tiff", ".webp"}


def load_reviewed_registry(path: Path | str) -> dict[str, Any]:
    return json.loads(Path(path).read_text(encoding="utf-8"))


def _is_downloadable_real_document_url(url: str, source_category: str) -> bool:
    parsed = urlparse(url)
    path = unquote(parsed.path).lower()
    suffix = Path(path).suffix
    if suffix in REAL_DOCUMENT_EXTENSIONS:
        return True
    if source_category in DOWNLOADABLE_SOURCE_CATEGORIES:
        return True
    return "download.do" in path and ".pdf" in unquote(url).lower()


def _safe_filename_part(text: str, max_len: int = 80) -> str:
    normalized = re.sub(r"[\\/:*?\"<>|\r\n\t]+", "_", text).strip(" ._")
    normalized = re.sub(r"\s+", "_", normalized)
    return normalized[:max_len] or "문서"


def _extension_from_url_or_content_type(url: str, content_type: str | None) -> str:
    path_suffix = Path(unquote(urlparse(url).path)).suffix.lower()
    if path_suffix in REAL_DOCUMENT_EXTENSIONS:
        return path_suffix
    if content_type:
        guessed = mimetypes.guess_extension(content_type.split(";")[0].strip())
        if guessed in REAL_DOCUMENT_EXTENSIONS:
            return guessed
    return ".pdf"


def select_real_external_document_candidates(registry: dict[str, Any]) -> list[dict[str, Any]]:
    candidates: list[dict[str, Any]] = []
    for row in registry.get("reviewed_sources", []):
        if row.get("review_status") != "accepted":
            continue
        if row.get("source_authority_level") not in {"official", "quasi_official"}:
            continue
        url = row.get("url", "")
        source_category = row.get("source_category", "")
        if not _is_downloadable_real_document_url(url, source_category):
            continue
        candidate = dict(row)
        candidate.update(
            {
                "actual_document_origin": "external_web_or_file",
                "generated_or_synthetic": False,
                "case1_promotion_state": "raw_public_form_candidate",
                "pii_policy": "public_blank_form_only_no_real_personal_data",
                "human_review_status": "needs_visual_review",
            }
        )
        candidates.append(candidate)
    return candidates


def _read_external_bytes(url: str, timeout: int = 45) -> tuple[bytes, str | None, str | None]:
    parsed = urlparse(url)
    if parsed.scheme == "file":
        raw_path = unquote(parsed.path)
        if re.match(r"^/[A-Za-z]:/", raw_path):
            raw_path = raw_path[1:]
        local_path = Path(raw_path)
        return local_path.read_bytes(), None, None
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 insurance-fds-real-document-collector/0.1",
            "Accept": "application/pdf,image/*,*/*;q=0.8",
        },
    )
    with urllib.request.urlopen(request, timeout=timeout) as response:
        data = response.read()
        content_type = response.headers.get("Content-Type")
        final_url = response.geturl()
        return data, content_type, final_url


def _profile_pdf_or_image(path: Path) -> dict[str, Any]:
    profile: dict[str, Any] = {"file_extension": path.suffix.lower()}
    if path.suffix.lower() == ".pdf":
        try:
            import fitz  # type: ignore

            doc = fitz.open(str(path))
            profile.update(
                {
                    "document_kind": "pdf",
                    "page_count": doc.page_count,
                    "is_encrypted": bool(doc.is_encrypted),
                    "metadata_title": (doc.metadata or {}).get("title") or "",
                }
            )
            if doc.page_count:
                page = doc.load_page(0)
                rect = page.rect
                text = page.get_text("text")[:2000]
                profile.update(
                    {
                        "first_page_width": round(rect.width, 2),
                        "first_page_height": round(rect.height, 2),
                        "first_page_text_chars": len(text),
                        "korean_field_signal_count": sum(
                            1 for keyword in ["보험금", "청구", "진료비", "영수증", "처방전", "진단", "입원", "통원"] if keyword in text
                        ),
                    }
                )
            doc.close()
        except Exception as exc:  # pragma: no cover - depends on optional PDF parser and malformed web PDFs.
            profile.update({"document_kind": "pdf", "profile_warning": f"pymupdf_profile_failed: {exc}"})
    else:
        profile["document_kind"] = "image"
    return profile


def collect_real_external_documents(registry: dict[str, Any], output_dir: Path | str, limit: int | None = None) -> dict[str, Any]:
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    raw_dir = output_path / "원본파일"
    raw_dir.mkdir(parents=True, exist_ok=True)

    selected = select_real_external_document_candidates(registry)
    if limit is not None:
        selected = selected[:limit]

    documents: list[dict[str, Any]] = []
    failures: list[dict[str, Any]] = []
    for candidate in selected:
        url = candidate["url"]
        try:
            data, content_type, final_url = _read_external_bytes(url)
            sha256 = hashlib.sha256(data).hexdigest()
            ext = _extension_from_url_or_content_type(final_url or url, content_type)
            filename = "__".join(
                [
                    candidate["source_id"],
                    _safe_filename_part(candidate["korean_filename_prefix"], 64),
                    _safe_filename_part(candidate.get("title") or candidate["source_id"], 80),
                ]
            ) + ext
            local_path = raw_dir / filename
            local_path.write_bytes(data)
            profile = _profile_pdf_or_image(local_path)
            documents.append(
                {
                    "source_id": candidate["source_id"],
                    "title": candidate.get("title"),
                    "url": url,
                    "final_url": final_url or url,
                    "source_authority_level": candidate.get("source_authority_level"),
                    "source_category": candidate.get("source_category"),
                    "covered_document_types": candidate.get("covered_document_types", []),
                    "korean_filename_prefix": candidate.get("korean_filename_prefix"),
                    "local_path": str(local_path),
                    "sha256": sha256,
                    "file_size_bytes": len(data),
                    "content_type": content_type or mimetypes.guess_type(local_path.name)[0] or "application/octet-stream",
                    "actual_document_origin": "external_web_or_file",
                    "generated_or_synthetic": False,
                    "pii_policy": "public_blank_form_only_no_real_personal_data",
                    "human_review_status": "needs_visual_review",
                    "case1_promotion_state": "raw_public_form_candidate",
                    "profile": profile,
                }
            )
        except (OSError, urllib.error.URLError, TimeoutError) as exc:
            failures.append(
                {
                    "source_id": candidate.get("source_id"),
                    "title": candidate.get("title"),
                    "url": url,
                    "error": str(exc),
                    "generated_or_synthetic": False,
                }
            )

    manifest = {
        "artifact": "케이스1_정상청구문서_실제외부문서_수집프로파일_v0_1",
        "case_family": "case1_normal_claim_document_collection",
        "created_at": datetime.now().isoformat(timespec="seconds"),
        "definition": "Case 1 normal documents must be real external/web documents or images, not generated documents.",
        "generated_documents_allowed": False,
        "privacy_policy": "public_blank_form_or_official_guidance_only; no real personal claim document is promoted outside quarantine",
        "selected_candidate_count": len(selected),
        "downloaded_count": len(documents),
        "failed_count": len(failures),
        "documents": documents,
        "failures": failures,
    }
    manifest["validation"] = validate_real_document_manifest(manifest)
    return manifest


def validate_real_document_manifest(manifest: dict[str, Any]) -> dict[str, Any]:
    documents = manifest.get("documents", [])
    generated_count = sum(1 for item in documents if item.get("generated_or_synthetic") is not False)
    missing_files = [item.get("local_path") for item in documents if not item.get("local_path") or not Path(item["local_path"]).exists()]
    missing_hash = [item.get("source_id") for item in documents if not re.fullmatch(r"[0-9a-f]{64}", item.get("sha256", ""))]
    non_external = [item.get("source_id") for item in documents if item.get("actual_document_origin") != "external_web_or_file"]
    return {
        "ok": generated_count == 0 and not missing_files and not missing_hash and not non_external and len(documents) > 0,
        "downloaded_real_document_count": len(documents),
        "generated_document_count": generated_count,
        "missing_files": missing_files,
        "missing_hash_source_ids": missing_hash,
        "non_external_source_ids": non_external,
    }


def build_human_review_table(manifest: dict[str, Any]) -> str:
    lines = [
        "# 케이스1 실제 외부 정상문서 육안검수표",
        "",
        "이 표의 파일은 생성 문서가 아니라 실제 웹/외부 출처에서 확보한 정상 문서 후보입니다.",
        "아직 학습 승격 상태가 아니며, 사람의 육안 검수와 개인정보/저작권/출처 검토가 필요합니다.",
        "",
        "| source_id | 출처등급 | 문서유형 | 생성여부 | 검수상태 | 파일 | sha256 | 제목 |",
        "|---|---|---|---|---|---|---|---|",
    ]
    for item in manifest.get("documents", []):
        docs = ", ".join(item.get("covered_document_types", []))
        generated_label = "생성문서 아님" if item.get("generated_or_synthetic") is False else "확인필요"
        lines.append(
            "| {source_id} | {level} | {docs} | {generated} | {review} | {file} | {sha} | {title} |".format(
                source_id=item.get("source_id", ""),
                level=item.get("source_authority_level", ""),
                docs=docs,
                generated=generated_label,
                review=item.get("human_review_status", ""),
                file=Path(item.get("local_path", "")).name,
                sha=item.get("sha256", "")[:12],
                title=str(item.get("title", "")).replace("|", "/"),
            )
        )
    return "\n".join(lines) + "\n"


def _redact_text_preview(text: str, max_len: int = 360) -> str:
    redacted = re.sub(r"\b\d{6}[- ]?[1-4]\d{6}\b", "<redacted-rrn>", text)
    redacted = re.sub(r"\b01[016789][- ]?\d{3,4}[- ]?\d{4}\b", "<redacted-phone>", redacted)
    redacted = re.sub(r"\b\d{2,4}[- ]?\d{3,4}[- ]?\d{4}\b", "<redacted-number>", redacted)
    redacted = re.sub(r"\s+", " ", redacted).strip()
    return redacted[:max_len]


def _render_pdf_first_page(pdf_path: Path, preview_path: Path, zoom: float = 1.5) -> dict[str, Any]:
    import fitz  # type: ignore

    doc = fitz.open(str(pdf_path))
    if doc.page_count < 1:
        doc.close()
        raise ValueError(f"PDF has no pages: {pdf_path}")
    page = doc.load_page(0)
    text = page.get_text("text")
    pixmap = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), alpha=False)
    preview_path.parent.mkdir(parents=True, exist_ok=True)
    pixmap.save(str(preview_path))
    rect = page.rect
    metadata = {
        "page_count": doc.page_count,
        "first_page_width": round(rect.width, 2),
        "first_page_height": round(rect.height, 2),
        "first_page_text_redacted_preview": _redact_text_preview(text),
        "first_page_text_chars": len(text),
    }
    doc.close()
    return metadata


def render_visual_review_previews(manifest: dict[str, Any], output_dir: Path | str) -> dict[str, Any]:
    output_path = Path(output_dir)
    preview_dir = output_path / "preview_images"
    preview_dir.mkdir(parents=True, exist_ok=True)
    previews: list[dict[str, Any]] = []
    failures: list[dict[str, Any]] = []

    for item in manifest.get("documents", []):
        source_id = item.get("source_id", "UNKNOWN")
        original_path = Path(item.get("local_path", ""))
        preview_path = preview_dir / f"{source_id}__first_page.png"
        try:
            if item.get("generated_or_synthetic") is not False:
                raise ValueError("generated_or_synthetic must be false for visual review preview")
            if item.get("actual_document_origin") != "external_web_or_file":
                raise ValueError("actual_document_origin must be external_web_or_file")
            if original_path.suffix.lower() == ".pdf":
                render_meta = _render_pdf_first_page(original_path, preview_path)
            elif original_path.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp", ".tif", ".tiff"}:
                preview_path.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(original_path, preview_path)
                render_meta = {"page_count": 1, "first_page_text_redacted_preview": "", "first_page_text_chars": 0}
            else:
                raise ValueError(f"unsupported preview extension: {original_path.suffix}")
            preview_bytes = preview_path.read_bytes()
            previews.append(
                {
                    "source_id": source_id,
                    "title": item.get("title"),
                    "covered_document_types": item.get("covered_document_types", []),
                    "original_path": str(original_path),
                    "original_sha256": item.get("sha256"),
                    "preview_image_path": str(preview_path),
                    "preview_sha256": hashlib.sha256(preview_bytes).hexdigest(),
                    "preview_file_size_bytes": len(preview_bytes),
                    "generated_or_synthetic": False,
                    "actual_document_origin": "external_web_or_file",
                    "review_recommendation": "needs_human_visual_review",
                    "privacy_review_state": "needs_public_blank_form_or_no_pii_confirmation",
                    **render_meta,
                }
            )
        except Exception as exc:  # pragma: no cover - exercised through integration artifacts for malformed PDFs.
            failures.append(
                {
                    "source_id": source_id,
                    "original_path": str(original_path),
                    "error": str(exc),
                    "generated_or_synthetic": item.get("generated_or_synthetic"),
                }
            )

    review_manifest = {
        "artifact": "케이스1_정상청구문서_육안검수_프리뷰_v0_1",
        "case_family": manifest.get("case_family", "case1_normal_claim_document_collection"),
        "created_at": datetime.now().isoformat(timespec="seconds"),
        "definition": "First-page image previews for human visual review of real external non-generated Case 1 documents.",
        "preview_count": len(previews),
        "failure_count": len(failures),
        "previews": previews,
        "failures": failures,
    }
    review_manifest["validation"] = validate_visual_review_manifest(review_manifest)
    return review_manifest


def validate_visual_review_manifest(review_manifest: dict[str, Any]) -> dict[str, Any]:
    previews = review_manifest.get("previews", [])
    generated_count = sum(1 for item in previews if item.get("generated_or_synthetic") is not False)
    missing_previews = [item.get("preview_image_path") for item in previews if not item.get("preview_image_path") or not Path(item["preview_image_path"]).exists()]
    missing_hash = [item.get("source_id") for item in previews if not re.fullmatch(r"[0-9a-f]{64}", item.get("preview_sha256", ""))]
    non_external = [item.get("source_id") for item in previews if item.get("actual_document_origin") != "external_web_or_file"]
    return {
        "ok": generated_count == 0 and not missing_previews and not missing_hash and not non_external and len(previews) > 0,
        "preview_count": len(previews),
        "missing_preview_count": len(missing_previews),
        "missing_preview_paths": missing_previews,
        "missing_hash_source_ids": missing_hash,
        "generated_document_count": generated_count,
        "non_external_source_ids": non_external,
    }


def build_visual_review_index(review_manifest: dict[str, Any]) -> str:
    lines = [
        "# 케이스1 실제 외부 정상문서 프리뷰 검수 인덱스",
        "",
        "이 인덱스는 생성물이 아닌 실제 외부 문서의 첫 페이지 preview를 사람이 검수하기 위한 보조 산출물입니다.",
        "문서 원본과 preview 모두 학습 승격 전 상태이며, 개인정보/저작권/공식출처 검수 전에는 downstream 생성에 사용하지 않습니다.",
        "",
        "| source_id | 문서유형 | 생성여부 | 검수권고 | preview | 원본 | redact 텍스트 미리보기 | 제목 |",
        "|---|---|---|---|---|---|---|---|",
    ]
    for item in review_manifest.get("previews", []):
        generated_label = "생성문서 아님" if item.get("generated_or_synthetic") is False else "확인필요"
        docs = ", ".join(item.get("covered_document_types", []))
        lines.append(
            "| {source_id} | {docs} | {generated} | {recommendation} | {preview} | {original} | {snippet} | {title} |".format(
                source_id=item.get("source_id", ""),
                docs=docs,
                generated=generated_label,
                recommendation=item.get("review_recommendation", ""),
                preview=Path(item.get("preview_image_path", "")).name,
                original=Path(item.get("original_path", "")).name,
                snippet=str(item.get("first_page_text_redacted_preview", "")).replace("|", "/")[:120],
                title=str(item.get("title", "")).replace("|", "/"),
            )
        )
    return "\n".join(lines) + "\n"


def write_visual_review_outputs(manifest_path: Path, output_dir: Path) -> dict[str, str]:
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    review_manifest = render_visual_review_previews(manifest, output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    review_manifest_path = output_dir / "케이스1_정상청구문서_육안검수_프리뷰_v0_1.ko.json"
    index_path = output_dir / "케이스1_정상청구문서_육안검수_프리뷰_인덱스_v0_1.ko.md"
    review_manifest_path.write_text(json.dumps(review_manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    index_path.write_text(build_visual_review_index(review_manifest), encoding="utf-8")
    return {"visual_review_manifest": str(review_manifest_path), "visual_review_index": str(index_path), "output_dir": str(output_dir)}


def write_collection_outputs(registry_path: Path, output_dir: Path, limit: int | None = None) -> dict[str, str]:
    registry = load_reviewed_registry(registry_path)
    manifest = collect_real_external_documents(registry, output_dir, limit=limit)
    output_dir.mkdir(parents=True, exist_ok=True)
    manifest_path = output_dir / "케이스1_정상청구문서_실제외부문서_수집프로파일_v0_1.ko.json"
    review_path = output_dir / "케이스1_정상청구문서_실제외부문서_육안검수표_v0_1.ko.md"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    review_path.write_text(build_human_review_table(manifest), encoding="utf-8")
    return {"manifest": str(manifest_path), "review_table": str(review_path), "output_dir": str(output_dir)}


def main() -> None:
    parser = argparse.ArgumentParser(description="Collect real external Case 1 normal insurance claim documents; generated documents are forbidden.")
    parser.add_argument("--registry", type=Path)
    parser.add_argument("--manifest", type=Path)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--mode", choices=["collect", "visual-review"], default="collect")
    args = parser.parse_args()
    if args.mode == "collect":
        if args.registry is None:
            parser.error("--registry is required when --mode collect")
        outputs = write_collection_outputs(args.registry, args.output_dir, limit=args.limit)
    else:
        if args.manifest is None:
            parser.error("--manifest is required when --mode visual-review")
        outputs = write_visual_review_outputs(args.manifest, args.output_dir)
    print(json.dumps(outputs, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
