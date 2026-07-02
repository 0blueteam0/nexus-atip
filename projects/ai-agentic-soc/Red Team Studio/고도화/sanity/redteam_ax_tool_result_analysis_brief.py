from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[3]
ARTIFACT_DIR = PROJECT_ROOT / "archive" / "runs" / "redteam-ax-v2-tool-result-analysis"
LATEST_JSON = ARTIFACT_DIR / "latest_tool_result_analysis_brief.json"
LATEST_MD = ARTIFACT_DIR / "latest_tool_result_analysis_brief.md"

INPUT_ARTIFACTS = [
    (
        "npm_audit",
        PROJECT_ROOT
        / "archive"
        / "runs"
        / "redteam-ax-v2-installed-tool-live-smoke"
        / "latest_installed_tool_live_smoke.json",
    ),
    (
        "nuclei_trivy",
        PROJECT_ROOT
        / "archive"
        / "runs"
        / "redteam-ax-v2-scanner-cli-live-smoke"
        / "latest_scanner_cli_live_smoke.json",
    ),
    (
        "openvas_zap_cli",
        PROJECT_ROOT
        / "archive"
        / "runs"
        / "redteam-ax-v2-openvas-zap-cli-live-smoke"
        / "latest_openvas_zap_cli_live_smoke.json",
    ),
    (
        "openvas_zap_service_import",
        PROJECT_ROOT
        / "archive"
        / "runs"
        / "redteam-ax-v2-openvas-zap-service-import-smoke"
        / "latest_openvas_zap_service_import_smoke.json",
    ),
    (
        "external_scanner_service_import_live",
        PROJECT_ROOT
        / "archive"
        / "runs"
        / "redteam-ax-v2-external-scanner-service-import-live"
        / "latest_external_scanner_service_import_live_smoke.json",
    ),
]

TOOL_AGENT_MAP = {
    "TOOL-NPM-AUDIT-001": "AGENT-NPM-AUDIT-ANALYST-001",
    "TOOL-NUCLEI-001": "AGENT-NUCLEI-ANALYST-001",
    "TOOL-TRIVY-001": "AGENT-TRIVY-ANALYST-001",
    "TOOL-OPENVAS-001": "AGENT-OPENVAS-ANALYST-001",
    "TOOL-ZAP-001": "AGENT-ZAP-ANALYST-001",
}

TOOL_KO = {
    "TOOL-NPM-AUDIT-001": "npm audit 의존성 점검",
    "TOOL-NUCLEI-001": "Nuclei 웹 취약점 템플릿 점검",
    "TOOL-TRIVY-001": "Trivy 컨테이너/의존성 점검",
    "TOOL-OPENVAS-001": "OpenVAS 취약점 스캐너",
    "TOOL-ZAP-001": "OWASP ZAP 웹 보안 점검",
}


def now_utc() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def read_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def status_is_positive(status: Any) -> bool:
    return str(status or "").lower() in {
        "passed",
        "normalized",
        "evidencecreated",
        "runnerexecuted",
        "outputimported",
        "allow",
        "ready",
    }


def evidence_item(tool_id: str, source_name: str, source_path: Path, payload: dict[str, Any]) -> dict[str, Any]:
    governed = payload.get("governed") or {}
    run = governed.get("run") or {}
    analyze = governed.get("agent_analyze") or {}
    evidence = governed.get("evidence") or {}
    return {
        "tool_id": tool_id,
        "tool_label_ko": TOOL_KO.get(tool_id, tool_id),
        "agent_id": TOOL_AGENT_MAP.get(tool_id, "AGENT-TOOL-RESULT-ANALYST-001"),
        "source": source_name,
        "source_artifact_path": source_path.as_posix(),
        "status": payload.get("status") or run.get("status"),
        "run_id": run.get("run_id") or payload.get("run_id"),
        "result_id": analyze.get("result_id") or payload.get("result_id"),
        "evidence_id": evidence.get("evidence_id") or payload.get("evidence_id"),
        "run_artifact_path": run.get("artifact_path") or payload.get("run_artifact_path"),
        "normalized_artifact_path": analyze.get("artifact_path") or payload.get("normalized_artifact_path"),
        "evidence_artifact_path": evidence.get("artifact_path") or payload.get("evidence_artifact_path"),
        "trusted_as_instruction": False,
        "requires_human_validation": True,
        "claim_evidence_matrix_hint": "Use only after analyst review and Evidence Card approval.",
    }


def blocked_item(tool_id: str, source_name: str, reason: str, status: str = "blocked") -> dict[str, Any]:
    return {
        "tool_id": tool_id,
        "tool_label_ko": TOOL_KO.get(tool_id, tool_id),
        "agent_id": TOOL_AGENT_MAP.get(tool_id, "AGENT-TOOL-RESULT-ANALYST-001"),
        "source": source_name,
        "status": status,
        "reason": reason,
        "trusted_as_instruction": False,
        "requires_human_validation": True,
    }


def collect_from_artifact(source_name: str, path: Path, data: dict[str, Any]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    executed: list[dict[str, Any]] = []
    blocked: list[dict[str, Any]] = []
    if not data:
        return executed, [blocked_item("UNKNOWN", source_name, f"missing artifact: {path.as_posix()}", "missing")]

    if data.get("tool_id"):
        item = evidence_item(str(data["tool_id"]), source_name, path, data)
        if status_is_positive(data.get("status")):
            executed.append(item)
        else:
            blocked.append(blocked_item(str(data["tool_id"]), source_name, str(data.get("status") or "not passed")))

    for tool in data.get("tools") or []:
        tool_id = str(tool.get("tool_id") or "UNKNOWN")
        if status_is_positive(tool.get("status")):
            executed.append(evidence_item(tool_id, source_name, path, tool))
        else:
            blocked.append(blocked_item(tool_id, source_name, str(tool.get("status") or "not passed")))

    for tool in data.get("blocked_tools") or []:
        blocked.append(
            blocked_item(
                str(tool.get("tool_id") or "UNKNOWN"),
                source_name,
                str(tool.get("reason") or tool.get("status") or "blocked"),
                str(tool.get("status") or "blocked"),
            )
        )

    blockers = data.get("blockers") or []
    if isinstance(blockers, list):
        for blocker in blockers:
            blocked.append(blocked_item("SERVICE-IMPORT", source_name, str(blocker), "blocked"))
    elif isinstance(blockers, dict):
        for name, values in blockers.items():
            for value in values or []:
                blocked.append(blocked_item(str(name), source_name, str(value), "blocked"))

    return executed, blocked


def build_brief() -> dict[str, Any]:
    executed: list[dict[str, Any]] = []
    blocked: list[dict[str, Any]] = []
    source_statuses: list[dict[str, Any]] = []
    for source_name, path in INPUT_ARTIFACTS:
        data = read_json(path)
        source_statuses.append({
            "source": source_name,
            "path": path.as_posix(),
            "exists": path.exists(),
            "status": data.get("status") if data else "missing",
            "created_at": data.get("created_at") if data else None,
        })
        source_executed, source_blocked = collect_from_artifact(source_name, path, data)
        executed.extend(source_executed)
        blocked.extend(source_blocked)

    supported_evidence = [item for item in executed if item.get("run_id") and item.get("result_id")]
    missing_evidence = [item for item in executed if not item.get("evidence_id")]
    sca_score = 0.9 if supported_evidence and not missing_evidence else 0.55 if supported_evidence else 0.2
    sufficient = bool(supported_evidence) and not missing_evidence
    status = "tool_result_analysis_ready" if sufficient else "tool_result_analysis_needs_review"

    claims = [
        {
            "claim_id": "CLAIM-TOOL-RUN-GOVERNED",
            "statement_ko": "승인된 도구 실행 흐름에서 일부 도구 결과가 정규화되었습니다.",
            "supporting_evidence_ids": [item["evidence_id"] for item in supported_evidence if item.get("evidence_id")],
            "support_level": "supported" if supported_evidence else "insufficient",
            "requires_human_approval": True,
        },
        {
            "claim_id": "CLAIM-HIGH-RISK-SCANNERS-BLOCKED",
            "statement_ko": "OpenVAS/ZAP 등 고위험 또는 외부 서비스 의존 도구는 준비 조건이 없으면 차단 상태로 남습니다.",
            "supporting_sources": [item["source"] for item in blocked if item.get("tool_id") in {"TOOL-OPENVAS-001", "TOOL-ZAP-001"}],
            "support_level": "supported" if blocked else "not_applicable",
            "requires_human_approval": True,
        },
    ]

    return {
        "kind": "redteam_ax_tool_result_analysis_brief",
        "created_at": now_utc(),
        "status": status,
        "safe_by_default": True,
        "commands_executed_by_api": False,
        "active_scan_executed": False,
        "trusted_as_instruction": False,
        "llm_raw_tool_output_trusted": False,
        "requires_human_validation": True,
        "source_statuses": source_statuses,
        "summary": {
            "executed_tool_count": len(executed),
            "supported_evidence_count": len(supported_evidence),
            "blocked_tool_count": len(blocked),
            "missing_evidence_link_count": len(missing_evidence),
        },
        "sca_report": {
            "sufficient": sufficient,
            "score": sca_score,
            "decision_ko": "근거 패키지 검토 가능" if sufficient else "사람 검토와 추가 근거가 필요",
            "missing_facts_ko": [
                "실제 취약점 스캔 결과가 아니라 버전/연동 스모크 결과입니다.",
                "승인된 Evidence Card 생성 및 Finding 연결은 별도 승인 단계가 필요합니다.",
            ] if not sufficient else [],
        },
        "tool_agents": [
            {
                "agent_id": item["agent_id"],
                "tool_id": item["tool_id"],
                "task_ko": f"{item['tool_label_ko']} 결과를 Evidence Card 후보와 보고서 주장 후보로 검토",
                "allowed_actions": ["요약", "오탐 가능성 표시", "추가 확인 질문 생성", "보고서 초안 문장 제안"],
                "prohibited_actions": ["도구 재실행", "활성 스캔 실행", "승인 없는 Finding 확정"],
            }
            for item in executed
        ],
        "evidence_pack": supported_evidence,
        "blocked_items": blocked,
        "claim_evidence_matrix_candidates": claims,
    }


def write_markdown(brief: dict[str, Any]) -> str:
    lines = [
        "# RedTeam AX Tool Result Analysis Brief",
        "",
        f"- status: `{brief['status']}`",
        f"- executed_tool_count: `{brief['summary']['executed_tool_count']}`",
        f"- supported_evidence_count: `{brief['summary']['supported_evidence_count']}`",
        f"- blocked_tool_count: `{brief['summary']['blocked_tool_count']}`",
        f"- SCA decision: `{brief['sca_report']['decision_ko']}`",
        "",
        "## Evidence Pack",
    ]
    for item in brief["evidence_pack"]:
        lines.append(
            f"- `{item['tool_id']}` {item['tool_label_ko']}: evidence `{item.get('evidence_id')}` "
            f"result `{item.get('result_id')}` run `{item.get('run_id')}`"
        )
    lines.extend(["", "## Blocked Items"])
    for item in brief["blocked_items"]:
        lines.append(f"- `{item['tool_id']}` {item['tool_label_ko']}: `{item['status']}` - {item.get('reason', '')}")
    lines.extend(["", "## Claim-Evidence Matrix Candidates"])
    for claim in brief["claim_evidence_matrix_candidates"]:
        lines.append(f"- `{claim['claim_id']}` {claim['statement_ko']} support `{claim['support_level']}`")
    return "\n".join(lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description="Build RedTeam AX tool result analysis brief from latest governed artifacts")
    parser.add_argument("--require-ready", action="store_true")
    args = parser.parse_args()
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    brief = build_brief()
    LATEST_JSON.write_text(json.dumps(brief, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    LATEST_MD.write_text(write_markdown(brief), encoding="utf-8")
    print(json.dumps({
        "status": brief["status"],
        "artifact_path": LATEST_JSON.as_posix(),
        "markdown_artifact_path": LATEST_MD.as_posix(),
        **brief["summary"],
    }, ensure_ascii=False))
    if args.require_ready and brief["status"] != "tool_result_analysis_ready":
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
