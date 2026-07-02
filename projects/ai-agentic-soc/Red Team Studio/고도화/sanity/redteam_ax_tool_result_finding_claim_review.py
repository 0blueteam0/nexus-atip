from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[3]
BRIEF_PATH = PROJECT_ROOT / "archive" / "runs" / "redteam-ax-v2-tool-result-analysis" / "latest_tool_result_analysis_brief.json"
ARTIFACT_DIR = PROJECT_ROOT / "archive" / "runs" / "redteam-ax-v2-tool-result-analysis"
LATEST_JSON = ARTIFACT_DIR / "latest_tool_result_finding_claim_review.json"
LATEST_MD = ARTIFACT_DIR / "latest_tool_result_finding_claim_review.md"

TOOL_FINDING_TEMPLATES = {
    "TOOL-NPM-AUDIT-001": {
        "finding_title_ko": "npm audit 실행 결과 검토 필요",
        "severity_draft": "info",
        "root_cause": ["의존성 점검 결과는 환경과 lockfile 범위를 확인한 뒤 판단해야 합니다."],
        "recommendation": ["package-lock과 실제 배포 범위를 확인한 뒤 필요한 패치 또는 예외 처리를 결정합니다."],
    },
    "TOOL-NUCLEI-001": {
        "finding_title_ko": "Nuclei 점검 결과 검토 필요",
        "severity_draft": "info",
        "root_cause": ["템플릿 기반 결과는 대상 범위, 템플릿 신뢰도, 재현 조건 확인이 필요합니다."],
        "recommendation": ["승인된 ROE 범위 안에서 오탐 가능성과 재현 근거를 사람이 검토합니다."],
    },
    "TOOL-TRIVY-001": {
        "finding_title_ko": "Trivy 점검 결과 검토 필요",
        "severity_draft": "info",
        "root_cause": ["컨테이너/의존성 취약점 후보는 실제 사용 여부와 보정 정보를 확인해야 합니다."],
        "recommendation": ["영향 받는 이미지, 패키지 버전, 예외 사유를 확인한 뒤 조치 계획을 작성합니다."],
    },
    "TOOL-OPENVAS-001": {
        "finding_title_ko": "OpenVAS 결과 검토 필요",
        "severity_draft": "info",
        "root_cause": ["OpenVAS 결과는 스캔 범위, 인증 여부, 플러그인 신뢰도를 확인해야 합니다."],
        "recommendation": ["read-only report 근거와 자산 소유자 검토를 거쳐 Finding 확정 여부를 결정합니다."],
    },
    "TOOL-ZAP-001": {
        "finding_title_ko": "OWASP ZAP 결과 검토 필요",
        "severity_draft": "info",
        "root_cause": ["ZAP 결과는 passive/active scan 여부와 애플리케이션 맥락을 확인해야 합니다."],
        "recommendation": ["passive alert 원문, 재현 조건, 보완 통제를 검토한 뒤 보고서 claim으로 승격합니다."],
    },
}


def now_utc() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def read_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def evidence_review_state(item: dict[str, Any]) -> dict[str, Any]:
    evidence_path = Path(str(item.get("evidence_artifact_path") or ""))
    evidence = read_json(evidence_path) if evidence_path.exists() else {}
    approval_status = str(evidence.get("approval_status") or evidence.get("status") or "unknown")
    approved = approval_status == "approved"
    return {
        "exists": evidence_path.exists(),
        "path": evidence_path.as_posix() if evidence_path else "",
        "approval_status": approval_status,
        "approved": approved,
        "errors": [] if evidence_path.exists() else ["evidence_artifact_missing"],
    }


def build_candidate(item: dict[str, Any], index: int) -> dict[str, Any]:
    tool_id = str(item.get("tool_id") or "UNKNOWN")
    template = TOOL_FINDING_TEMPLATES.get(tool_id, {
        "finding_title_ko": "도구 결과 검토 필요",
        "severity_draft": "info",
        "root_cause": ["도구 결과는 사람 검토 후 Finding으로 확정해야 합니다."],
        "recommendation": ["Evidence Card와 원본 산출물을 확인합니다."],
    })
    evidence_state = evidence_review_state(item)
    finding_id = f"F-TOOL-REVIEW-{index:03d}"
    claim_id = f"C-TOOL-REVIEW-{index:03d}"
    evidence_id = str(item.get("evidence_id") or "")
    status = "ready_for_finding_review" if evidence_state["approved"] else "hold_until_evidence_approved"
    return {
        "candidate_id": f"TFR-{index:03d}",
        "tool_id": tool_id,
        "tool_label_ko": item.get("tool_label_ko") or tool_id,
        "agent_id": item.get("agent_id"),
        "status": status,
        "finding_payload": {
            "finding_id": finding_id,
            "case_id": "CASE-V2-TOOL-RESULT-REVIEW-001",
            "title": template["finding_title_ko"],
            "severity_draft": template["severity_draft"],
            "confidence": 0.5,
            "observation": f"{item.get('tool_label_ko') or tool_id} 결과가 정규화되어 Evidence 후보와 연결되었습니다.",
            "evidence_ids": [evidence_id] if evidence_id else [],
            "root_cause": template["root_cause"],
            "business_impact": "현재 단계에서는 영향도 확정 전입니다. 승인된 Evidence와 자산 맥락 검토가 필요합니다.",
            "recommendation": template["recommendation"],
            "owner": "business_owner",
            "sla": "review_required",
            "verification_method": "Evidence Card, normalized result, original tool run artifact review",
            "retest_criteria": "Finding 승인 전 동일 Evidence ID와 원본 artifact가 검증되어야 합니다.",
        },
        "claim_candidate": {
            "claim_id": claim_id,
            "support_level": "supported" if evidence_id else "unsupported",
            "evidence_ids": [evidence_id] if evidence_id else [],
            "status": "hold_unsupported_claim" if not evidence_state["approved"] else "ready_for_report_claim_review",
            "statement_ko": f"{item.get('tool_label_ko') or tool_id} 결과가 검토 가능한 보안 관찰 근거로 수집되었습니다.",
            "hold_reason": "" if evidence_state["approved"] else "Evidence Card approval is required before report claim use.",
        },
        "source_refs": {
            "run_id": item.get("run_id"),
            "result_id": item.get("result_id"),
            "evidence_id": evidence_id,
            "run_artifact_path": item.get("run_artifact_path"),
            "normalized_artifact_path": item.get("normalized_artifact_path"),
            "evidence_artifact_path": item.get("evidence_artifact_path"),
        },
        "evidence_review": evidence_state,
        "human_actions_required_ko": [
            "Evidence Card 승인 상태를 확인합니다.",
            "원본 도구 출력과 정규화 결과를 비교합니다.",
            "오탐 가능성과 자산 영향도를 사람이 판단합니다.",
            "필요하면 /api/redteam/v2/findings로 Finding 초안을 만들고 2인 severity 승인을 받습니다.",
        ],
        "not_performed": [
            "finding_created",
            "finding_approved",
            "report_claim_inserted",
            "tool_reexecuted",
            "active_scan_executed",
        ],
    }


def build_review_package() -> dict[str, Any]:
    brief = read_json(BRIEF_PATH)
    evidence_pack = brief.get("evidence_pack") if isinstance(brief.get("evidence_pack"), list) else []
    candidates = [build_candidate(item, index + 1) for index, item in enumerate(evidence_pack)]
    held = [item for item in candidates if item["status"] != "ready_for_finding_review"]
    status = "finding_claim_review_ready" if candidates and not held else "finding_claim_review_needs_evidence_approval"
    if not candidates:
        status = "awaiting_tool_result_analysis_brief"
    return {
        "kind": "redteam_ax_tool_result_finding_claim_review",
        "created_at": now_utc(),
        "status": status,
        "safe_by_default": True,
        "commands_executed_by_api": False,
        "active_scan_executed": False,
        "trusted_as_instruction": False,
        "finding_created": False,
        "report_claim_inserted": False,
        "requires_human_validation": True,
        "source_brief_path": BRIEF_PATH.as_posix(),
        "source_brief_status": brief.get("status") or "missing",
        "candidate_count": len(candidates),
        "held_candidate_count": len(held),
        "ready_candidate_count": len(candidates) - len(held),
        "candidates": candidates,
        "claim_evidence_matrix_preview": [item["claim_candidate"] for item in candidates],
        "blocked_items": [
            {
                "candidate_id": item["candidate_id"],
                "tool_id": item["tool_id"],
                "reason": item["claim_candidate"]["hold_reason"] or "human review required",
            }
            for item in held
        ],
    }


def write_markdown(package: dict[str, Any]) -> str:
    lines = [
        "# RedTeam AX Tool Result Finding/Claim Review",
        "",
        f"- status: `{package['status']}`",
        f"- candidate_count: `{package['candidate_count']}`",
        f"- ready_candidate_count: `{package['ready_candidate_count']}`",
        f"- held_candidate_count: `{package['held_candidate_count']}`",
        f"- finding_created: `{str(package['finding_created']).lower()}`",
        f"- report_claim_inserted: `{str(package['report_claim_inserted']).lower()}`",
        "",
        "## Candidates",
    ]
    for item in package["candidates"]:
        lines.append(
            f"- `{item['candidate_id']}` `{item['tool_id']}` {item['finding_payload']['title']} "
            f"status `{item['status']}` evidence `{','.join(item['finding_payload']['evidence_ids']) or '-'}`"
        )
    lines.extend(["", "## Blocked Items"])
    for item in package["blocked_items"]:
        lines.append(f"- `{item['candidate_id']}` `{item['tool_id']}`: {item['reason']}")
    return "\n".join(lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description="Build RedTeam AX finding/claim review package from tool result brief")
    parser.add_argument("--require-ready", action="store_true")
    args = parser.parse_args()
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    package = build_review_package()
    LATEST_JSON.write_text(json.dumps(package, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    LATEST_MD.write_text(write_markdown(package), encoding="utf-8")
    print(json.dumps({
        "status": package["status"],
        "artifact_path": LATEST_JSON.as_posix(),
        "markdown_artifact_path": LATEST_MD.as_posix(),
        "candidate_count": package["candidate_count"],
        "ready_candidate_count": package["ready_candidate_count"],
        "held_candidate_count": package["held_candidate_count"],
    }, ensure_ascii=False))
    if args.require_ready and package["status"] != "finding_claim_review_ready":
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
