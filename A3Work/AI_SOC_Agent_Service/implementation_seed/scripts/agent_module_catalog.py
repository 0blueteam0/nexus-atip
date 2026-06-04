"""AI SOC agent module catalog and LangGraph connection blueprint.

This module is intentionally deterministic and connector-free. It defines the
agent modules that can later be backed by LLM prompts, ML signals, or SOC tool
connectors, while preserving the current seed's no-autonomous-response safety
boundary.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
CATALOG_ID = 'ai_soc_agent_module_catalog_v1'


def build_agent_module_catalog() -> dict[str, Any]:
    """Return the reviewable module catalog for the AI SOC agent service seed."""
    modules = [
        {
            'id': 'evidence_intake_agent',
            'name': 'Evidence Intake Agent',
            'category': 'intake',
            'runtime_mode': 'deterministic_seed_now_llm_optional_later',
            'mission': 'Normalize incoming alerts and already-collected Evidence Packages into graph state.',
            'inputs': ['normalized_alert', 'evidence_package'],
            'outputs': ['case_id', 'alert_id', 'tenant_id', 'reason_codes'],
            'langgraph_nodes': ['ingest_evidence_package'],
            'candidate_backends': ['stdlib_json', 'schema_validator', 'future_llm_normalizer'],
            'safety_gates': ['tenant_id_required', 'no_external_lookup_without_connector_contract'],
            'human_review_touchpoint': False,
        },
        {
            'id': 'evidence_contract_agent',
            'name': 'Evidence Contract Agent',
            'category': 'contract_gate',
            'runtime_mode': 'deterministic_required',
            'mission': 'Validate that required Evidence Package sections exist before any investigation summary is drafted.',
            'inputs': ['evidence_package'],
            'outputs': ['contract_valid', 'contract_errors'],
            'langgraph_nodes': ['validate_evidence_contract'],
            'candidate_backends': ['json_schema', 'stdlib_contract_checks'],
            'safety_gates': ['missing_evidence_must_remain_missing', 'citation_required_for_case_claims'],
            'human_review_touchpoint': False,
        },
        {
            'id': 'timeline_investigation_agent',
            'name': 'Timeline Investigation Agent',
            'category': 'investigation',
            'runtime_mode': 'deterministic_seed_now_llm_summarizer_later',
            'mission': 'Count and summarize supplied timeline events without inferring events that are not present.',
            'inputs': ['evidence_package.timeline'],
            'outputs': ['timeline_event_count', 'timeline_summary'],
            'langgraph_nodes': ['investigate_timeline'],
            'candidate_backends': ['stdlib_timeline_counter', 'future_timeline_summarizer'],
            'safety_gates': ['unsupported_conclusion_count_must_be_zero'],
            'human_review_touchpoint': False,
        },
        {
            'id': 'mitre_context_agent',
            'name': 'MITRE Context Agent',
            'category': 'context_mapping',
            'runtime_mode': 'bounded_mapping_seed_now_retrieval_later',
            'mission': 'Map known reason codes to conservative ATT&CK review hints, never to high-confidence verdicts.',
            'inputs': ['reason_codes', 'evidence_types'],
            'outputs': ['mitre_context'],
            'langgraph_nodes': ['map_mitre_context'],
            'candidate_backends': ['reason_code_map', 'future_attack_kb_retriever'],
            'safety_gates': ['ml_score_is_signal_not_verdict', 'mapping_requires_reason_code_or_citation'],
            'human_review_touchpoint': False,
        },
        {
            'id': 'policy_guardrail_agent',
            'name': 'Policy Guardrail Agent',
            'category': 'safety_gate',
            'runtime_mode': 'deterministic_required',
            'mission': 'Enforce tenant, prompt-injection, missing-evidence, and no-autonomous-response guardrails.',
            'inputs': ['security', 'policy_decision', 'assurance', 'contract_valid'],
            'outputs': ['human_review_required', 'automation_allowed', 'response_action'],
            'langgraph_nodes': ['assess_guardrails'],
            'candidate_backends': ['policy_rules', 'future_policy_engine'],
            'safety_gates': [
                'no_autonomous_response',
                'no_production_soc_connection',
                'no_cross_tenant_context_expansion',
                'human_review_required',
            ],
            'human_review_touchpoint': True,
        },
        {
            'id': 'analyst_brief_agent',
            'name': 'Analyst Brief Agent',
            'category': 'human_review_output',
            'runtime_mode': 'deterministic_seed_now_llm_drafter_later',
            'mission': 'Draft a bounded analyst review brief with citations, missing-evidence notes, and no response action.',
            'inputs': ['timeline_summary', 'mitre_context', 'collected', 'missing', 'guardrail_state'],
            'outputs': ['review_brief'],
            'langgraph_nodes': ['draft_human_review_brief'],
            'candidate_backends': ['template_renderer', 'future_llm_brief_writer'],
            'safety_gates': ['citation_required_for_case_claims', 'recommended_next_step_human_review_only'],
            'human_review_touchpoint': True,
        },
        {
            'id': 'replay_evaluation_agent',
            'name': 'Replay Evaluation Agent',
            'category': 'evaluation',
            'runtime_mode': 'deterministic_required',
            'mission': 'Evaluate fixture replay metrics and decide go/hold/no-go for the next seed increment.',
            'inputs': ['fixtures', 'dataset_manifest', 'langgraph_run_reports'],
            'outputs': ['metrics', 'go_decision', 'assurance_summary'],
            'langgraph_nodes': [],
            'candidate_backends': ['replay_runner', 'dataset_registry'],
            'safety_gates': ['tenant_leakage_count_zero', 'unsupported_conclusion_count_zero'],
            'human_review_touchpoint': True,
        },
    ]
    return {
        'schema_version': '1.0',
        'catalog_id': CATALOG_ID,
        'purpose': 'Ideate and freeze AI SOC agent modules before wiring them into LangGraph or connector-backed runtimes.',
        'execution_boundary': {
            'current_seed': 'local_fixture_only_no_connector_no_soc_action',
            'future_allowed_expansion': [
                'llm_summarizer_after_citation_gate',
                'retrieval_after_dataset_contract',
                'soc_connector_after_explicit_approval_and_sandbox',
            ],
            'forbidden_now': [
                'production_siem_query',
                'edr_host_isolation',
                'iam_account_lock',
                'firewall_block',
                'cross_tenant_context_expansion',
            ],
        },
        'modules': modules,
        'module_edges': build_module_graph_edges(),
        'quality_gates': [
            'all_langgraph_nodes_have_module_owner',
            'deterministic_safety_gate_after_context_mapping',
            'human_review_before_any_response_action',
            'replay_evaluation_before_next_seed_go',
        ],
    }


def build_module_graph_edges() -> list[dict[str, str]]:
    """Return the planned module-to-module flow, including evaluation feedback."""
    return [
        {'from': 'START', 'to': 'evidence_intake_agent', 'condition': 'evidence_package_present'},
        {'from': 'evidence_intake_agent', 'to': 'evidence_contract_agent', 'condition': 'state_normalized'},
        {'from': 'evidence_contract_agent', 'to': 'timeline_investigation_agent', 'condition': 'contract_checked'},
        {'from': 'timeline_investigation_agent', 'to': 'mitre_context_agent', 'condition': 'timeline_summarized'},
        {'from': 'mitre_context_agent', 'to': 'policy_guardrail_agent', 'condition': 'context_mapped'},
        {'from': 'policy_guardrail_agent', 'to': 'analyst_brief_agent', 'condition': 'human_review_required'},
        {'from': 'analyst_brief_agent', 'to': 'replay_evaluation_agent', 'condition': 'brief_ready_for_offline_replay'},
        {'from': 'replay_evaluation_agent', 'to': 'END', 'condition': 'go_hold_no_go_recorded'},
    ]


def build_langgraph_node_module_map(catalog: dict[str, Any] | None = None) -> dict[str, str]:
    """Map concrete LangGraph node ids to the owning agent module id."""
    module_catalog = catalog or build_agent_module_catalog()
    mapping: dict[str, str] = {}
    for module in module_catalog['modules']:
        for node_id in module.get('langgraph_nodes', []):
            mapping[node_id] = module['id']
    return mapping


def build_module_assurance(graph_spec: dict[str, Any], catalog: dict[str, Any] | None = None) -> dict[str, Any]:
    """Check whether every graph node is owned by a catalog module."""
    module_catalog = catalog or build_agent_module_catalog()
    node_module_map = build_langgraph_node_module_map(module_catalog)
    graph_node_ids = [node['id'] for node in graph_spec['nodes']]
    missing_module_owner = [node_id for node_id in graph_node_ids if node_id not in node_module_map]
    orphan_modules = [
        module['id']
        for module in module_catalog['modules']
        if module.get('category') != 'evaluation' and not module.get('langgraph_nodes')
    ]
    deterministic_required_modules = [
        module['id'] for module in module_catalog['modules'] if module['runtime_mode'] == 'deterministic_required'
    ]
    return {
        'all_langgraph_nodes_have_module_owner': not missing_module_owner,
        'node_module_map': node_module_map,
        'missing_module_owner': missing_module_owner,
        'orphan_non_evaluation_modules': orphan_modules,
        'deterministic_required_modules': deterministic_required_modules,
    }


def render_module_mermaid(catalog: dict[str, Any] | None = None) -> str:
    """Render the module catalog as a reviewable Mermaid flowchart."""
    module_catalog = catalog or build_agent_module_catalog()
    lines = [
        'flowchart TD',
        '  %% AI SOC agent module catalog: connector-free seed, human review required',
    ]
    for edge in module_catalog['module_edges']:
        lines.append(f"  {edge['from']} --> {edge['to']}")
        lines.append(f"  %% condition: {edge['from']} -> {edge['to']}: {edge['condition'].replace('_', ' ')}")
    lines.extend(
        [
            '  classDef safety fill:#3b1d1d,stroke:#ff6b6b,color:#ffffff,stroke-width:2px',
            '  classDef review fill:#1d2b3b,stroke:#74c0fc,color:#ffffff,stroke-width:2px',
            '  classDef evaluation fill:#1d3b2a,stroke:#63e6be,color:#ffffff,stroke-width:2px',
        ]
    )
    for module in module_catalog['modules']:
        if module['category'] == 'safety_gate':
            lines.append(f"  class {module['id']} safety")
        elif module['human_review_touchpoint']:
            lines.append(f"  class {module['id']} review")
        if module['category'] == 'evaluation':
            lines.append(f"  class {module['id']} evaluation")
    lines.append('  %% invariant: no autonomous response; analyst brief and replay evaluation before expansion')
    return '\n'.join(lines) + '\n'


def write_module_catalog(out_path: Path) -> None:
    """Write the module catalog JSON artifact."""
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open('w', encoding='utf-8') as fp:
        json.dump(build_agent_module_catalog(), fp, ensure_ascii=False, indent=2)
        fp.write('\n')


def write_module_mermaid(out_path: Path) -> None:
    """Write the module catalog Mermaid artifact."""
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(render_module_mermaid(), encoding='utf-8')


def main() -> int:
    """CLI entry point for writing the module catalog artifacts."""
    parser = argparse.ArgumentParser(description='Build AI SOC agent module catalog artifacts.')
    parser.add_argument('--catalog-out', default=str(ROOT / 'reports' / 'agent_module_catalog_v1.json'))
    parser.add_argument('--mermaid-out', default=str(ROOT / 'reports' / 'agent_module_catalog_v1.mmd'))
    args = parser.parse_args()

    write_module_catalog(Path(args.catalog_out))
    write_module_mermaid(Path(args.mermaid_out))
    print(
        json.dumps(
            {'catalog_out': args.catalog_out, 'mermaid_out': args.mermaid_out, 'catalog': build_agent_module_catalog()},
            ensure_ascii=False,
            indent=2,
        )
    )
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
