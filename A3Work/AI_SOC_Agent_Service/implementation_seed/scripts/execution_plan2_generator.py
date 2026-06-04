"""Generate AI security monitoring agent execution plan #2 artifacts.

The plan binds the public dataset metadata spec v2 to conservative SOC agent
workstreams. It remains metadata-only: no public dataset download and no
production SOC connector execution.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from dataset_registry import DatasetRegistry
from doc_addendum_generator import _table, write_docx_from_markdown

ROOT = Path(__file__).resolve().parents[1]
PROJECT_ROOT = ROOT.parent
REPORTS_DIR = ROOT / "reports"
DOCX_DIR = PROJECT_ROOT / "docx"


def utc_now() -> str:
    """Return an ISO-8601 UTC timestamp without microseconds."""
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def load_json(path: Path) -> dict[str, Any]:
    """Load a UTF-8 JSON object from disk."""
    with path.open("r", encoding="utf-8") as fp:
        data = json.load(fp)
    if not isinstance(data, dict):
        raise ValueError(f"JSON root must be object: {path}")
    return data


def build_execution_plan2_sections(metadata_report: dict[str, Any], replay_metrics: dict[str, Any]) -> dict[str, Any]:
    """Build execution plan #2 sections from dataset metadata and replay metrics."""
    sources = metadata_report["sources"]
    source_ids = [source["source_id"] for source in sources]
    return {
        "plan_version": "2.0",
        "generated_at": utc_now(),
        "scope": {
            "goal": "metadata-only public dataset contracts를 Agent Assurance 중심 실행계획으로 연결한다.",
            "inputs": [
                "public_dataset_metadata_spec_v2",
                "dataset_case_spec_plan_v0",
                "replay_metrics_v1",
                "existing_doc14_doc20_doc22_addenda",
            ],
            "excluded": [
                "public_dataset_download",
                "production_siem_edr_soar_connection",
                "autonomous_response",
            ],
        },
        "safety_gates": {
            "download_gate": "blocked_until_explicit_approval",
            "license_gate": "required_before_raw_ingestion",
            "evidence_gate": "Evidence Package completeness and citation required",
            "policy_gate": "Policy Gate blocks tenant leakage and unsupported conclusions",
            "response_gate": "human_review_first",
        },
        "dataset_summary": {
            "execution_mode": metadata_report["execution_mode"],
            "public_sources": metadata_report["summary"]["public_sources"],
            "download_requires_approval": metadata_report["summary"]["download_requires_approval"],
            "high_or_medium_risk_sources": metadata_report["summary"]["high_or_medium_risk_sources"],
            "source_ids": source_ids,
        },
        "replay_summary": {
            "decision": replay_metrics["go_decision"]["decision"],
            "total_cases": replay_metrics["summary"]["total_cases"],
            "tenant_leakage_count": replay_metrics["summary"]["tenant_leakage_count"],
            "unsupported_conclusion_count": replay_metrics["summary"]["unsupported_conclusion_count"],
        },
        "workstreams": [
            {
                "id": "WS-01",
                "name": "Dataset Contract Hardening",
                "objective": "각 공개데이터셋의 access/raw/normalization/evaluation metadata contract를 유지한다.",
                "deliverables": "dataset_source_metadata_spec_v2.json, schema validation tests",
                "gate": "download_allowed=false and approval flags true for public sources",
            },
            {
                "id": "WS-02",
                "name": "Evidence Package Adapter Interface",
                "objective": "raw parser 전 단계에서 required mappings와 unsupported field handling을 명시한다.",
                "deliverables": "PublicDatasetAdapter metadata_stub contract, case specs",
                "gate": "unsupported fields become missing evidence, not inferred facts",
            },
            {
                "id": "WS-03",
                "name": "Investigation Agent MVP",
                "objective": "alert intake, evidence plan, timeline, entity context, triage draft를 read-only로 생성한다.",
                "deliverables": "agent API contract, replay-backed test cases",
                "gate": "Evidence Gate and Policy Gate before every draft verdict",
            },
            {
                "id": "WS-04",
                "name": "Agent Assurance Replay",
                "objective": "metadata-only public case specs와 synthetic fixtures를 회귀평가에 묶는다.",
                "deliverables": "replay_metrics_v2 candidate, regression thresholds",
                "gate": "tenant_leakage_count=0 and unsupported_conclusion_count=0",
            },
            {
                "id": "WS-05",
                "name": "Human Review Operations",
                "objective": "추천/초안만 제공하고 승인 패키지, 감사 로그, 수동 조치 요청을 분리한다.",
                "deliverables": "review queue fields, audit trace checklist",
                "gate": "no account lockout, isolation, firewall block, or customer notice without approval",
            },
        ],
        "milestones": [
            {"id": "M1", "name": "Week 1", "exit": "metadata spec v2 and plan #2 artifacts verified"},
            {"id": "M2", "name": "Week 2", "exit": "adapter interface tests for one selected public source"},
            {"id": "M3", "name": "Week 3", "exit": "Investigation Agent draft API contract and fixtures"},
            {"id": "M4", "name": "Week 4", "exit": "Replay v2 regression report with human-review gates"},
        ],
        "source_contracts": [
            {
                "source_id": source["source_id"],
                "risk": source["access_gate"]["pii_or_sensitive_risk"],
                "target_schemas": ", ".join(source["normalization_contract"]["target_schemas"]),
                "primary_metrics": ", ".join(source["evaluation_use"]["primary_metrics"]),
                "excluded_uses": ", ".join(source["evaluation_use"]["excluded_uses"]),
            }
            for source in sources
        ],
    }


def render_execution_plan2_markdown(sections: dict[str, Any]) -> str:
    """Render execution plan #2 markdown."""
    workstream_rows = [
        [item["id"], item["name"], item["objective"], item["deliverables"], item["gate"]]
        for item in sections["workstreams"]
    ]
    milestone_rows = [[item["id"], item["name"], item["exit"]] for item in sections["milestones"]]
    source_rows = [
        [
            item["source_id"],
            item["risk"],
            item["target_schemas"],
            item["primary_metrics"],
            item["excluded_uses"],
        ]
        for item in sections["source_contracts"]
    ]
    gates = sections["safety_gates"]
    return "\n".join(
        [
            "---",
            "title: AI SOC Agent Service AI 보안관제 에이전트 실행계획 #2",
            "project: AI_SOC_Agent_Service",
            "para: Projects",
            "zettel_type: execution_plan",
            "validation_status: executable_seed_verified",
            "---",
            "",
            "# AI 보안관제 에이전트 실행계획 #2",
            "",
            "## 목적",
            "",
            sections["scope"]["goal"],
            "",
            "## 입력과 제외 범위",
            "",
            f"- 입력: {', '.join(sections['scope']['inputs'])}",
            f"- 제외: {', '.join(sections['scope']['excluded'])}",
            f"- 공개데이터셋 실행 모드: {sections['dataset_summary']['execution_mode']}",
            "",
            "## Safety Gates",
            "",
            f"- Download Gate: {gates['download_gate']}",
            f"- License Gate: {gates['license_gate']}",
            f"- Evidence Package / Evidence Gate: {gates['evidence_gate']}",
            f"- Policy Gate: {gates['policy_gate']}",
            f"- Human Review / Response Gate: {gates['response_gate']}",
            "",
            "## Dataset Contract Summary",
            "",
            f"- public_sources: {sections['dataset_summary']['public_sources']}",
            f"- download_requires_approval: {sections['dataset_summary']['download_requires_approval']}",
            f"- high_or_medium_risk_sources: {sections['dataset_summary']['high_or_medium_risk_sources']}",
            f"- source_ids: {', '.join(sections['dataset_summary']['source_ids'])}",
            "",
            _table(["source", "risk", "target_schemas", "primary_metrics", "excluded_uses"], source_rows),
            "",
            "## Workstreams",
            "",
            _table(["id", "name", "objective", "deliverables", "gate"], workstream_rows),
            "",
            "## 4주 실행 마일스톤",
            "",
            _table(["id", "name", "exit criteria"], milestone_rows),
            "",
            "## Replay 기준선",
            "",
            f"- decision: {sections['replay_summary']['decision']}",
            f"- total_cases: {sections['replay_summary']['total_cases']}",
            f"- tenant_leakage_count: {sections['replay_summary']['tenant_leakage_count']}",
            f"- unsupported_conclusion_count: {sections['replay_summary']['unsupported_conclusion_count']}",
            "",
            "## 다음 구현 후보",
            "",
            "1. 한 개 공개데이터셋을 선택해 raw download 없이 parser interface test부터 작성한다.",
            "2. Investigation Agent draft API schema를 Evidence Package 중심으로 추가한다.",
            "3. Replay Runner v2에서 metadata spec coverage metric을 추가한다.",
        ]
    )


def write_execution_plan2_artifacts(
    sections: dict[str, Any], out_dir: Path = PROJECT_ROOT, docx_dir: Path = DOCX_DIR
) -> dict[str, Path]:
    """Write execution plan #2 markdown, docx, and summary json."""
    out_dir.mkdir(parents=True, exist_ok=True)
    docx_dir.mkdir(parents=True, exist_ok=True)
    markdown_path = out_dir / "AI_SOC_Agent_Service_24_AI보안관제_에이전트_실행계획_2.md"
    docx_path = docx_dir / "24_AI보안관제_에이전트_실행계획_2.docx"
    summary_path = REPORTS_DIR / "execution_plan2_summary.json" if out_dir == PROJECT_ROOT else out_dir / "execution_plan2_summary.json"
    markdown_path.write_text(render_execution_plan2_markdown(sections), encoding="utf-8")
    write_docx_from_markdown(markdown_path, docx_path)
    summary = {
        "plan_version": sections["plan_version"],
        "generated_at": sections["generated_at"],
        "markdown": str(markdown_path),
        "docx": str(docx_path),
        "workstreams": len(sections["workstreams"]),
        "milestones": len(sections["milestones"]),
        "dataset_sources": len(sections["source_contracts"]),
    }
    summary_path.parent.mkdir(parents=True, exist_ok=True)
    summary_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return {"markdown": markdown_path, "docx": docx_path, "summary_json": summary_path}


def main() -> int:
    metadata_path = REPORTS_DIR / "dataset_source_metadata_spec_v2.json"
    replay_path = REPORTS_DIR / "replay_metrics_v1.json"
    if not metadata_path.exists():
        DatasetRegistry().write_source_metadata_spec_report(metadata_path)
    metadata_report = load_json(metadata_path)
    replay_metrics = load_json(replay_path)
    sections = build_execution_plan2_sections(metadata_report, replay_metrics)
    artifacts = write_execution_plan2_artifacts(sections)
    print(json.dumps({key: str(path) for key, path in artifacts.items()}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
