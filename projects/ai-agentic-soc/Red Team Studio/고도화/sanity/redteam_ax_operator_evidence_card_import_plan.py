from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[3]
ARTIFACT_DIR = PROJECT_ROOT / "archive" / "runs" / "redteam-ax-v2-operator-evidence-collection"
VALIDATION_PATH = ARTIFACT_DIR / "latest_operator_evidence_submission_validation.json"
JSON_ARTIFACT_PATH = ARTIFACT_DIR / "latest_operator_evidence_card_import_plan.json"
MD_ARTIFACT_PATH = ARTIFACT_DIR / "latest_operator_evidence_card_import_plan.md"


def now_utc() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def load_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def evidence_id_for(item: dict[str, Any]) -> str:
    raw = str(item.get("item_id") or "UNKNOWN").replace("OEC-", "EV-OEC-")
    return "".join(ch if ch.isalnum() or ch in "-_" else "-" for ch in raw).upper()


def build_candidate(item: dict[str, Any], case_id: str) -> dict[str, Any]:
    evidence_id = evidence_id_for(item)
    return {
        "evidence_id": evidence_id,
        "case_id": case_id,
        "source_path_or_url": item.get("artifact_path") or "",
        "summary": (
            f"Operator-approved live readiness evidence for {item.get('item_id')} "
            f"with status {item.get('artifact_status')} and SHA-256 {item.get('sha256_actual')}"
        ),
        "evidence_type": "operator_live_readiness_artifact",
        "validation_status": "verified",
        "approval_status": "pending_review",
        "source_item_id": item.get("item_id"),
        "source_sha256": item.get("sha256_actual"),
        "source_artifact_status": item.get("artifact_status"),
        "trusted_as_instruction": False,
        "requires_human_validation": True,
        "claim_evidence_matrix_hint": {
            "claim_scope": "runtime_readiness",
            "support_level": "candidate_until_evidence_card_review",
            "finding_use_allowed": False,
        },
    }


def build_import_plan(args: argparse.Namespace) -> dict[str, Any]:
    validation = load_json(VALIDATION_PATH)
    case_id = str(args.case_id or validation.get("case_id") or "CASE-V2-LIVE-READINESS-PROMOTION")
    validation_items = validation.get("validation_items") or []
    approved_items = [
        item
        for item in validation_items
        if item.get("approved") and not item.get("errors") and item.get("sha256_match") and item.get("status_match")
    ]
    blocked_items = [item for item in validation_items if item not in approved_items]
    candidates = [build_candidate(item, case_id) for item in approved_items]
    status = "evidence_card_import_ready" if candidates and not blocked_items else (
        "evidence_card_import_partially_ready" if candidates else "awaiting_approved_operator_evidence"
    )
    return {
        "kind": "redteam_ax_operator_evidence_card_import_plan",
        "schema_version": "0.1",
        "created_at": now_utc(),
        "source_validation_artifact": VALIDATION_PATH.as_posix(),
        "status": status,
        "safe_by_default": True,
        "commands_executed_by_api": False,
        "commands_executed_by_planner": False,
        "evidence_cards_created": False,
        "active_scan_executed": False,
        "trusted_as_instruction": False,
        "secret_material_collected": False,
        "requires_human_validation": True,
        "case_id": case_id,
        "candidate_count": len(candidates),
        "blocked_item_count": len(blocked_items),
        "evidence_card_candidates": candidates,
        "blocked_items": [
            {
                "item_id": item.get("item_id"),
                "artifact_path": item.get("artifact_path") or "",
                "errors": item.get("errors") or ["not_approved_or_not_verified"],
                "review_status": item.get("review_status") or "missing",
            }
            for item in blocked_items
        ],
        "next_api": "POST /api/redteam/v2/evidence after human review of each candidate",
        "markdown_artifact_path": MD_ARTIFACT_PATH.as_posix(),
    }


def render_markdown(plan: dict[str, Any]) -> str:
    lines = [
        "# RedTeam AX Operator Evidence Card Import Plan",
        "",
        f"- status: `{plan['status']}`",
        f"- case_id: `{plan['case_id']}`",
        f"- candidate_count: `{plan['candidate_count']}`",
        f"- blocked_item_count: `{plan['blocked_item_count']}`",
        "",
        "## Safety Boundary",
        "",
        "- This plan does not create Evidence Cards automatically.",
        "- It does not execute Docker, WSL, scanner, MCP, or network commands.",
        "- Each candidate must be reviewed before calling the Evidence Card API.",
        "",
        "## Evidence Card Candidates",
        "",
    ]
    if not plan["evidence_card_candidates"]:
        lines.append("- No approved operator evidence is ready for Evidence Card import.")
        lines.append("")
    for candidate in plan["evidence_card_candidates"]:
        lines.extend([
            f"### {candidate['evidence_id']}",
            "",
            f"- source_item_id: `{candidate['source_item_id']}`",
            f"- source_path_or_url: `{candidate['source_path_or_url']}`",
            f"- source_artifact_status: `{candidate['source_artifact_status']}`",
            f"- source_sha256: `{candidate['source_sha256']}`",
            "",
        ])
    if plan["blocked_items"]:
        lines.extend(["## Blocked Items", ""])
        for item in plan["blocked_items"]:
            errors = ", ".join(item["errors"]) or "-"
            lines.append(f"- `{item['item_id']}`: {errors}")
    return "\n".join(lines).rstrip() + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description="Build RedTeam AX operator Evidence Card import plan.")
    parser.add_argument("--case-id", default="CASE-V2-LIVE-READINESS-PROMOTION")
    parser.add_argument("--require-ready", action="store_true", help="Return non-zero unless import plan is ready.")
    args = parser.parse_args()
    plan = build_import_plan(args)
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    JSON_ARTIFACT_PATH.write_text(json.dumps(plan, ensure_ascii=False, indent=2), encoding="utf-8", newline="\n")
    MD_ARTIFACT_PATH.write_text(render_markdown(plan), encoding="utf-8", newline="\n")
    print(json.dumps({
        "status": plan["status"],
        "artifact_path": JSON_ARTIFACT_PATH.as_posix(),
        "markdown_artifact_path": MD_ARTIFACT_PATH.as_posix(),
        "candidate_count": plan["candidate_count"],
        "blocked_item_count": plan["blocked_item_count"],
    }, ensure_ascii=False))
    return 2 if args.require_ready and plan["status"] != "evidence_card_import_ready" else 0


if __name__ == "__main__":
    raise SystemExit(main())
