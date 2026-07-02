from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[3]
ARTIFACT_DIR = PROJECT_ROOT / "archive" / "runs" / "redteam-ax-v2-operator-evidence-collection"
JSON_ARTIFACT_PATH = ARTIFACT_DIR / "latest_operator_evidence_collection_package.json"
MD_ARTIFACT_PATH = ARTIFACT_DIR / "latest_operator_evidence_collection_package.md"
RUNBOOK_PATH = (
    PROJECT_ROOT
    / "archive"
    / "runs"
    / "redteam-ax-v2-live-readiness-remediation"
    / "latest_live_readiness_remediation_runbook.json"
)


def now_utc() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def load_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def expected_status_from_required_artifact(required_artifact: str) -> str:
    marker = "status="
    if marker not in required_artifact:
        return "passed"
    return required_artifact.split(marker, 1)[1].split()[0].strip("`.,;")


def build_collection_item(step: dict[str, Any]) -> dict[str, Any]:
    step_id = str(step.get("step_id") or "UNKNOWN")
    required_artifact = str(step.get("evidence_required") or "step evidence artifact")
    return {
        "item_id": f"OEC-{step_id}",
        "source_step_id": step_id,
        "title": step.get("title") or step_id,
        "owner": step.get("owner") or "red_team_lead",
        "current_step_status": step.get("status") or "unknown",
        "blockers": step.get("blockers") or [],
        "operator_actions": step.get("actions") or [],
        "verification_command": step.get("verification_command") or "",
        "required_evidence": required_artifact,
        "expected_attachment": {
            "kind": "sanity_artifact",
            "status_field": "status",
            "required_status": expected_status_from_required_artifact(required_artifact),
            "source": required_artifact,
        },
        "collection_notes": [
            "운영자가 ROE/HITL 범위에서 직접 수행하고 산출물을 첨부한다.",
            "이 패키지는 명령을 실행하지 않으며 secret 값을 수집하지 않는다.",
            "첨부 artifact는 Evidence Card 후보로 등록한 뒤 사람이 승인한다.",
        ],
    }


def build_package(args: argparse.Namespace) -> dict[str, Any]:
    runbook = load_json(RUNBOOK_PATH)
    steps = runbook.get("steps") or []
    collection_items = [build_collection_item(step) for step in steps]
    blocked_items = [item for item in collection_items if item["current_step_status"] != "ready"]
    return {
        "kind": "redteam_ax_operator_evidence_collection_package",
        "schema_version": "0.1",
        "created_at": now_utc(),
        "source_runbook_artifact": RUNBOOK_PATH.as_posix(),
        "status": "ready_for_operator_evidence_collection" if blocked_items else "operator_evidence_inputs_ready",
        "safe_by_default": True,
        "commands_executed_by_api": False,
        "commands_executed_by_package": False,
        "active_scan_executed": False,
        "trusted_as_instruction": False,
        "secret_material_collected": False,
        "requires_human_validation": True,
        "collection_item_count": len(collection_items),
        "blocked_collection_item_count": len(blocked_items),
        "collection_items": collection_items,
        "markdown_artifact_path": MD_ARTIFACT_PATH.as_posix(),
        "operator_submission_manifest_template": {
            "case_id": "CASE-V2-LIVE-READINESS-PROMOTION",
            "operator_identity": "<operator@example.com>",
            "roe_reference": "<approved ROE id>",
            "attached_artifacts": [
                {
                    "item_id": item["item_id"],
                    "artifact_path": "<attach generated sanity artifact path>",
                    "sha256": "<sha256 after collection>",
                    "review_status": "pending_human_review",
                }
                for item in collection_items
            ],
        },
        "final_validation_commands": [
            (
                ".\\.venv\\Scripts\\python.exe "
                "\"Red Team Studio\\고도화\\sanity\\redteam_ax_live_readiness_remediation_runbook.py\" "
                "--require-clear"
            ),
            (
                ".\\.venv\\Scripts\\python.exe "
                "\"Red Team Studio\\고도화\\sanity\\redteam_ax_strict_live_readiness_promotion.py\" "
                "--allow-container --allow-network --require-promotion"
            ),
        ],
    }


def render_markdown(package: dict[str, Any]) -> str:
    lines = [
        "# RedTeam AX Operator Evidence Collection Package",
        "",
        f"- status: `{package['status']}`",
        f"- created_at: `{package['created_at']}`",
        f"- collection_item_count: `{package['collection_item_count']}`",
        f"- blocked_collection_item_count: `{package['blocked_collection_item_count']}`",
        "",
        "## Safety Boundary",
        "",
        "- This package does not execute commands.",
        "- Do not paste API keys, passwords, bearer tokens, cookies, or scanner secrets.",
        "- Attach generated sanity artifacts only after human review.",
        "",
        "## Collection Items",
        "",
    ]
    for item in package["collection_items"]:
        lines.extend([
            f"### {item['item_id']} {item['title']}",
            "",
            f"- owner: `{item['owner']}`",
            f"- current_step_status: `{item['current_step_status']}`",
            f"- blockers: `{', '.join(item['blockers']) or '-'}`",
            f"- required_evidence: `{item['required_evidence']}`",
            "",
            "Operator actions:",
        ])
        lines.extend(f"- {action}" for action in item["operator_actions"])
        if item["verification_command"]:
            lines.extend([
                "",
                "Verification command:",
                "",
                f"```powershell\n{item['verification_command']}\n```",
            ])
        lines.append("")
    lines.extend(["## Final Validation", ""])
    for command in package["final_validation_commands"]:
        lines.extend(["```powershell", command, "```", ""])
    return "\n".join(lines).rstrip() + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description="Build RedTeam AX operator evidence collection package.")
    parser.add_argument(
        "--require-inputs-ready",
        action="store_true",
        help="Return non-zero if any evidence item is still blocked.",
    )
    args = parser.parse_args()
    package = build_package(args)
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    JSON_ARTIFACT_PATH.write_text(json.dumps(package, ensure_ascii=False, indent=2), encoding="utf-8", newline="\n")
    MD_ARTIFACT_PATH.write_text(render_markdown(package), encoding="utf-8", newline="\n")
    print(json.dumps({
        "status": package["status"],
        "artifact_path": JSON_ARTIFACT_PATH.as_posix(),
        "markdown_artifact_path": MD_ARTIFACT_PATH.as_posix(),
        "collection_item_count": package["collection_item_count"],
        "blocked_collection_item_count": package["blocked_collection_item_count"],
    }, ensure_ascii=False))
    return 2 if args.require_inputs_ready and package["blocked_collection_item_count"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
