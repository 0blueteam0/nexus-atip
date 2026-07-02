from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[3]
ARTIFACT_DIR = PROJECT_ROOT / "archive" / "runs" / "redteam-ax-v2-operator-evidence-collection"
PACKAGE_PATH = ARTIFACT_DIR / "latest_operator_evidence_collection_package.json"
JSON_ARTIFACT_PATH = ARTIFACT_DIR / "latest_operator_evidence_submission_validation.json"
MD_ARTIFACT_PATH = ARTIFACT_DIR / "latest_operator_evidence_submission_validation.md"


def now_utc() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def load_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def resolve_artifact_path(raw_path: str) -> Path:
    path = Path(raw_path)
    if path.is_absolute():
        return path
    return PROJECT_ROOT / path


def expected_items(package: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {str(item.get("item_id")): item for item in package.get("collection_items") or []}


def validate_attachment(attachment: dict[str, Any], expected: dict[str, Any]) -> dict[str, Any]:
    artifact_path_raw = str(attachment.get("artifact_path") or "")
    artifact_path = resolve_artifact_path(artifact_path_raw) if artifact_path_raw else Path("")
    expected_attachment = expected.get("expected_attachment") or {}
    expected_status = str(expected_attachment.get("required_status") or "passed")
    status_field = str(expected_attachment.get("status_field") or "status")
    result = {
        "item_id": attachment.get("item_id"),
        "artifact_path": artifact_path_raw,
        "expected_status": expected_status,
        "review_status": attachment.get("review_status") or "missing",
        "exists": bool(artifact_path_raw and artifact_path.exists()),
        "sha256_expected": attachment.get("sha256") or "",
        "sha256_actual": "",
        "artifact_status": "missing",
        "status_match": False,
        "sha256_match": False,
        "approved": attachment.get("review_status") == "approved",
        "errors": [],
    }
    if not artifact_path_raw:
        result["errors"].append("artifact_path_missing")
        return result
    if not artifact_path.exists():
        result["errors"].append("artifact_path_not_found")
        return result
    actual_sha256 = sha256_file(artifact_path)
    result["sha256_actual"] = actual_sha256
    result["sha256_match"] = bool(result["sha256_expected"] and result["sha256_expected"] == actual_sha256)
    if not result["sha256_match"]:
        result["errors"].append("sha256_mismatch_or_missing")
    artifact = load_json(artifact_path)
    artifact_status = str(artifact.get(status_field) or artifact.get("status") or "unknown")
    result["artifact_status"] = artifact_status
    result["status_match"] = artifact_status == expected_status
    if not result["status_match"]:
        result["errors"].append(f"status_not_{expected_status}")
    if not result["approved"]:
        result["errors"].append("human_review_not_approved")
    return result


def build_pending_submission(package: dict[str, Any]) -> dict[str, Any]:
    return {
        "case_id": "CASE-V2-LIVE-READINESS-PROMOTION",
        "operator_identity": "<operator@example.com>",
        "roe_reference": "<approved ROE id>",
        "attached_artifacts": [
            {
                "item_id": item.get("item_id"),
                "artifact_path": "",
                "sha256": "",
                "review_status": "pending_human_review",
            }
            for item in package.get("collection_items") or []
        ],
    }


def build_validation(args: argparse.Namespace) -> dict[str, Any]:
    package = load_json(PACKAGE_PATH)
    expected_by_id = expected_items(package)
    submission_path = Path(args.submission_manifest).resolve() if args.submission_manifest else None
    submission = load_json(submission_path) if submission_path else build_pending_submission(package)
    attachments = submission.get("attached_artifacts") or []
    unknown_items = [
        str(item.get("item_id"))
        for item in attachments
        if str(item.get("item_id")) not in expected_by_id
    ]
    validation_items = [
        validate_attachment(item, expected_by_id[str(item.get("item_id"))])
        for item in attachments
        if str(item.get("item_id")) in expected_by_id
    ]
    missing_items = sorted(set(expected_by_id) - {str(item.get("item_id")) for item in attachments})
    failed_items = [item for item in validation_items if item["errors"]]
    approved_items = [item for item in validation_items if item["approved"] and not item["errors"]]
    status = (
        "operator_evidence_submitted_ready"
        if not failed_items and not missing_items and not unknown_items
        else (
            "awaiting_operator_evidence_submission"
            if not args.submission_manifest
            else "operator_evidence_submission_blocked"
        )
    )
    return {
        "kind": "redteam_ax_operator_evidence_submission_validation",
        "schema_version": "0.1",
        "created_at": now_utc(),
        "source_package_artifact": PACKAGE_PATH.as_posix(),
        "submission_manifest_path": submission_path.as_posix() if submission_path else "",
        "status": status,
        "safe_by_default": True,
        "commands_executed_by_api": False,
        "commands_executed_by_validator": False,
        "active_scan_executed": False,
        "trusted_as_instruction": False,
        "secret_material_collected": False,
        "requires_human_validation": True,
        "expected_item_count": len(expected_by_id),
        "submitted_item_count": len(attachments),
        "approved_item_count": len(approved_items),
        "blocked_item_count": len(failed_items) + len(missing_items) + len(unknown_items),
        "missing_items": missing_items,
        "unknown_items": unknown_items,
        "validation_items": validation_items,
        "operator_submission_manifest_template": build_pending_submission(package),
        "markdown_artifact_path": MD_ARTIFACT_PATH.as_posix(),
    }


def render_markdown(validation: dict[str, Any]) -> str:
    lines = [
        "# RedTeam AX Operator Evidence Submission Validation",
        "",
        f"- status: `{validation['status']}`",
        f"- expected_item_count: `{validation['expected_item_count']}`",
        f"- submitted_item_count: `{validation['submitted_item_count']}`",
        f"- approved_item_count: `{validation['approved_item_count']}`",
        f"- blocked_item_count: `{validation['blocked_item_count']}`",
        "",
        "## Safety Boundary",
        "",
        "- This validator reads local artifact files only.",
        "- It does not execute Docker, WSL, scanner, MCP, or network commands.",
        "- It validates artifact existence, SHA-256, expected status, and human review status.",
        "",
        "## Items",
        "",
    ]
    for item in validation["validation_items"]:
        errors = ", ".join(item["errors"]) or "-"
        lines.extend([
            f"### {item['item_id']}",
            "",
            f"- artifact_path: `{item['artifact_path']}`",
            f"- artifact_status: `{item['artifact_status']}`",
            f"- expected_status: `{item['expected_status']}`",
            f"- sha256_match: `{item['sha256_match']}`",
            f"- review_status: `{item['review_status']}`",
            f"- errors: `{errors}`",
            "",
        ])
    if validation["missing_items"]:
        lines.extend(["## Missing Items", ""])
        lines.extend(f"- `{item}`" for item in validation["missing_items"])
        lines.append("")
    if validation["unknown_items"]:
        lines.extend(["## Unknown Items", ""])
        lines.extend(f"- `{item}`" for item in validation["unknown_items"])
        lines.append("")
    return "\n".join(lines).rstrip() + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate RedTeam AX operator evidence submission manifest.")
    parser.add_argument("--submission-manifest", default="", help="Path to an operator submission manifest JSON file.")
    parser.add_argument(
        "--require-approved",
        action="store_true",
        help=(
            "Return non-zero unless every expected evidence item is present, hash-matched, "
            "status-matched, and approved."
        ),
    )
    args = parser.parse_args()
    validation = build_validation(args)
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    JSON_ARTIFACT_PATH.write_text(json.dumps(validation, ensure_ascii=False, indent=2), encoding="utf-8", newline="\n")
    MD_ARTIFACT_PATH.write_text(render_markdown(validation), encoding="utf-8", newline="\n")
    print(json.dumps({
        "status": validation["status"],
        "artifact_path": JSON_ARTIFACT_PATH.as_posix(),
        "markdown_artifact_path": MD_ARTIFACT_PATH.as_posix(),
        "expected_item_count": validation["expected_item_count"],
        "blocked_item_count": validation["blocked_item_count"],
    }, ensure_ascii=False))
    return 2 if args.require_approved and validation["status"] != "operator_evidence_submitted_ready" else 0


if __name__ == "__main__":
    raise SystemExit(main())
