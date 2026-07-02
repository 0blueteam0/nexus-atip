from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[3]
ARTIFACT_DIR = PROJECT_ROOT / "archive" / "runs" / "redteam-ax-v2-live-readiness-remediation"
JSON_ARTIFACT_PATH = ARTIFACT_DIR / "latest_live_readiness_remediation_runbook.json"
MD_ARTIFACT_PATH = ARTIFACT_DIR / "latest_live_readiness_remediation_runbook.md"
PROMOTION_ARTIFACT_PATH = (
    PROJECT_ROOT
    / "archive"
    / "runs"
    / "redteam-ax-v2-strict-live-readiness-promotion"
    / "latest_strict_live_readiness_promotion.json"
)


def now_utc() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def load_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def gate_by_id(promotion: dict[str, Any], gate_id: str) -> dict[str, Any]:
    for item in promotion.get("gate_results") or []:
        if item.get("gate_id") == gate_id:
            return item
    return {}


def step(
    step_id: str,
    title: str,
    owner: str,
    blockers: list[str],
    actions: list[str],
    verification: str,
    evidence: str,
) -> dict[str, Any]:
    return {
        "step_id": step_id,
        "title": title,
        "owner": owner,
        "status": "ready" if not blockers else "blocked",
        "blockers": blockers,
        "actions": actions,
        "verification_command": verification,
        "evidence_required": evidence,
        "safety_notes": [
            "웹앱 상태 조회 API가 이 작업을 대신 실행하지 않는다.",
            "승인된 ROE/HITL 범위에서 사람이 수행하고 결과 artifact를 첨부한다.",
            "secret 값은 저장하지 않고 외부 vault reference만 사용한다.",
        ],
    }


def build_runbook(args: argparse.Namespace) -> dict[str, Any]:
    promotion = load_json(PROMOTION_ARTIFACT_PATH)
    container_gate = gate_by_id(promotion, "PROMOTE-CONTAINER-RUNTIME-REAL")
    wsl_gate = gate_by_id(promotion, "PROMOTE-WSL-RUNTIME-READY")
    scanner_gate = gate_by_id(promotion, "PROMOTE-EXTERNAL-SCANNER-READINESS")
    import_gate = gate_by_id(promotion, "PROMOTE-EXTERNAL-SCANNER-IMPORT-LIVE")
    steps = [
        step(
            "LRR-DOCKER-001",
            "Docker Desktop daemon 준비",
            "platform_operator",
            container_gate.get("blockers") or ["promotion_artifact_missing"],
            [
                "Docker Desktop을 시작하고 engine 상태가 Running인지 확인한다.",
                "프록시/VPN/Windows service 오류가 있으면 Docker Desktop 진단 로그를 확인한다.",
                "승인된 local image digest가 준비될 때까지 pull 또는 이미지 변경을 promotion gate가 자동 수행하지 않는다.",
            ],
            ".\\.venv\\Scripts\\python.exe \"Red Team Studio\\고도화\\sanity\\redteam_ax_container_runtime_smoke.py\" --allow-real --require-real",
            "latest_container_runtime_smoke.json status=passed",
        ),
        step(
            "LRR-WSL-001",
            "WSL 배포판 mount/start 복구",
            "platform_operator",
            wsl_gate.get("blockers") or ["promotion_artifact_missing"],
            [
                "wsl.exe -l -v로 대상 배포판 이름과 상태를 확인한다.",
                "현재 Ubuntu-22.04 VHDX mount/start 오류가 있으면 백업 후 복구하거나 새 승인된 분석 배포판을 만든다.",
                "배포판 안에서 node/npm/trivy/nuclei/docker/podman 경로가 필요한 경우 설치 증거를 남긴다.",
            ],
            ".\\.venv\\Scripts\\python.exe \"Red Team Studio\\고도화\\sanity\\redteam_ax_wsl_runtime_readiness.py\" --allow-start --require-ready",
            "latest_wsl_runtime_readiness.json status=ready",
        ),
        step(
            "LRR-SCANNER-ENDPOINT-001",
            "OpenVAS/ZAP read-only endpoint와 vault reference 설정",
            "red_team_lead",
            scanner_gate.get("blockers") or ["promotion_artifact_missing"],
            [
                "REDTEAM_AX_OPENVAS_READONLY_REPORT_ENDPOINT에 승인된 read-only OpenVAS report URL을 설정한다.",
                "REDTEAM_AX_ZAP_READONLY_ALERT_ENDPOINT에 승인된 read-only ZAP alert/report URL을 설정한다.",
                "REDTEAM_AX_OPENVAS_VAULT_REF와 REDTEAM_AX_ZAP_VAULT_REF에는 secret 값이 아니라 외부 vault reference만 설정한다.",
                "endpoint URL에 credential query, write/admin/delete/scan mutating path term이 없는지 확인한다.",
            ],
            ".\\.venv\\Scripts\\python.exe \"Red Team Studio\\고도화\\sanity\\redteam_ax_external_scanner_service_readiness.py\" --allow-network --require-ready",
            "latest_external_scanner_service_readiness.json status=ready",
        ),
        step(
            "LRR-SCANNER-IMPORT-001",
            "OpenVAS/ZAP read-only report import 실측",
            "control_team",
            import_gate.get("blockers") or ["promotion_artifact_missing"],
            [
                "ROE가 승인한 endpoint에서만 read-only import를 수행한다.",
                "backend credential authorization과 scanner-service-import API를 통과해야 한다.",
                "import 결과가 Evidence Card와 normalized parser output으로 연결되는지 확인한다.",
            ],
            ".\\.venv\\Scripts\\python.exe \"Red Team Studio\\고도화\\sanity\\redteam_ax_external_scanner_service_import_live_smoke.py\" --allow-network --require-ready",
            "latest_external_scanner_service_import_live_smoke.json status=passed",
        ),
        step(
            "LRR-PROMOTION-001",
            "최종 strict live readiness promotion",
            "red_team_lead",
            promotion.get("blockers") or ["promotion_artifact_missing"],
            [
                "위 네 단계를 모두 통과한 뒤에만 최종 promotion gate를 실행한다.",
                "통제된 검증 환경에서 --allow-container --allow-network --require-promotion을 함께 사용한다.",
                "통과 artifact를 completion audit RTA-COMP-015에 첨부한다.",
            ],
            ".\\.venv\\Scripts\\python.exe \"Red Team Studio\\고도화\\sanity\\redteam_ax_strict_live_readiness_promotion.py\" --allow-container --allow-network --require-promotion",
            "latest_strict_live_readiness_promotion.json status=promotion_ready",
        ),
    ]
    blocked_steps = [item for item in steps if item["status"] != "ready"]
    return {
        "kind": "redteam_ax_live_readiness_remediation_runbook",
        "created_at": now_utc(),
        "source_promotion_artifact": PROMOTION_ARTIFACT_PATH.as_posix(),
        "status": "ready_for_operator_remediation" if blocked_steps else "promotion_inputs_ready",
        "safe_by_default": True,
        "commands_executed_by_api": False,
        "active_scan_executed": False,
        "trusted_as_instruction": False,
        "requires_human_validation": True,
        "step_count": len(steps),
        "blocked_step_count": len(blocked_steps),
        "steps": steps,
        "markdown_artifact_path": MD_ARTIFACT_PATH.as_posix(),
        "operator_summary": [
            "Docker, WSL, OpenVAS/ZAP endpoint, vault reference를 순서대로 준비한다.",
            "각 단계는 사람이 수행하고 해당 sanity artifact로 증명한다.",
            "최종 완료 주장은 strict promotion gate가 promotion_ready일 때만 가능하다.",
        ],
    }


def render_markdown(runbook: dict[str, Any]) -> str:
    lines = [
        "# RedTeam AX Live Readiness Remediation Runbook",
        "",
        f"- status: `{runbook['status']}`",
        f"- created_at: `{runbook['created_at']}`",
        f"- blocked_step_count: `{runbook['blocked_step_count']}`",
        "",
        "## Operator Summary",
        "",
    ]
    lines.extend(f"- {item}" for item in runbook["operator_summary"])
    lines.extend(["", "## Steps", ""])
    for item in runbook["steps"]:
        lines.extend([
            f"### {item['step_id']} {item['title']}",
            "",
            f"- owner: `{item['owner']}`",
            f"- status: `{item['status']}`",
            f"- blockers: `{', '.join(item['blockers']) or '-'}`",
            "",
            "Actions:",
        ])
        lines.extend(f"- {action}" for action in item["actions"])
        lines.extend([
            "",
            "Verification:",
            "",
            f"```powershell\n{item['verification_command']}\n```",
            "",
            f"Evidence required: `{item['evidence_required']}`",
            "",
        ])
    return "\n".join(lines).rstrip() + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description="Build RedTeam AX live readiness remediation runbook artifact.")
    parser.add_argument("--require-clear", action="store_true", help="Return non-zero if any remediation step is still blocked.")
    args = parser.parse_args()
    runbook = build_runbook(args)
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    JSON_ARTIFACT_PATH.write_text(json.dumps(runbook, ensure_ascii=False, indent=2), encoding="utf-8", newline="\n")
    MD_ARTIFACT_PATH.write_text(render_markdown(runbook), encoding="utf-8", newline="\n")
    print(json.dumps({
        "status": runbook["status"],
        "artifact_path": JSON_ARTIFACT_PATH.as_posix(),
        "markdown_artifact_path": MD_ARTIFACT_PATH.as_posix(),
        "blocked_step_count": runbook["blocked_step_count"],
    }, ensure_ascii=False))
    return 2 if args.require_clear and runbook["blocked_step_count"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
