"""LangGraph-based AI SOC investigation agent composition seed.

The graph is intentionally bounded: it accepts an already-built Evidence Package,
performs deterministic validation/investigation steps, drafts a human-review
brief, and never triggers operational response actions.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, TypedDict

from langgraph.graph import END, StateGraph

ROOT = Path(__file__).resolve().parents[1]
GRAPH_ID = 'ai_soc_investigation_langgraph_seed_v1'


class InvestigationState(TypedDict, total=False):
    """State passed between LangGraph investigation nodes."""

    evidence_package: dict[str, Any]
    visited_nodes: list[str]
    case_id: str
    alert_id: str
    tenant_id: str
    contract_valid: bool
    contract_errors: list[str]
    timeline_event_count: int
    timeline_summary: str
    mitre_context: list[str]
    reason_codes: list[str]
    human_review_required: bool
    automation_allowed: bool
    response_action: str
    review_brief: dict[str, Any]


class AgentGraphComposer:
    """Build a LangGraph-compatible SOC investigation topology spec."""

    def build_spec(self) -> dict[str, Any]:
        """Return a serializable graph specification for review and documentation."""
        return {
            'schema_version': '1.0',
            'graph_id': GRAPH_ID,
            'runtime_target': 'langgraph_stategraph_compatible',
            'requires_langgraph_install_for_seed_tests': False,
            'state_contract': {
                'input_fields': ['evidence_package', 'visited_nodes'],
                'required_output_fields': [
                    'case_id',
                    'timeline_event_count',
                    'human_review_required',
                    'automation_allowed',
                    'response_action',
                    'review_brief',
                ],
            },
            'nodes': [
                {
                    'id': 'ingest_evidence_package',
                    'role': 'input_normalizer',
                    'description': 'Load case, alert, tenant, and existing reason code fields from an Evidence Package.',
                },
                {
                    'id': 'validate_evidence_contract',
                    'role': 'contract_gate',
                    'description': 'Check required Evidence Package sections before investigation proceeds.',
                },
                {
                    'id': 'investigate_timeline',
                    'role': 'timeline_investigator',
                    'description': 'Summarize timeline coverage without inventing missing events.',
                },
                {
                    'id': 'map_mitre_context',
                    'role': 'context_mapper',
                    'description': 'Derive conservative MITRE context hints from reason codes and evidence types.',
                },
                {
                    'id': 'assess_guardrails',
                    'role': 'safety_gate',
                    'description': 'Enforce human review and no autonomous response.',
                },
                {
                    'id': 'draft_human_review_brief',
                    'role': 'analyst_brief_writer',
                    'description': 'Draft a bounded human-review brief with citations and missing-evidence notes.',
                },
            ],
            'edges': [
                {'from': 'START', 'to': 'ingest_evidence_package', 'condition': 'evidence_package_present'},
                {'from': 'ingest_evidence_package', 'to': 'validate_evidence_contract', 'condition': 'always'},
                {'from': 'validate_evidence_contract', 'to': 'investigate_timeline', 'condition': 'contract_checked'},
                {'from': 'investigate_timeline', 'to': 'map_mitre_context', 'condition': 'timeline_summarized'},
                {'from': 'map_mitre_context', 'to': 'assess_guardrails', 'condition': 'context_mapped'},
                {
                    'from': 'assess_guardrails',
                    'to': 'draft_human_review_brief',
                    'condition': 'always_requires_human_review',
                },
                {'from': 'draft_human_review_brief', 'to': 'END', 'condition': 'brief_ready'},
            ],
            'safety_invariants': [
                'no_autonomous_response',
                'no_production_soc_connection',
                'no_cross_tenant_context_expansion',
                'citation_required_for_case_claims',
                'missing_evidence_must_remain_missing',
                'human_review_required',
            ],
        }


def _append_visit(state: InvestigationState, node_id: str) -> list[str]:
    return [*state.get('visited_nodes', []), node_id]


def ingest_evidence_package(state: InvestigationState) -> InvestigationState:
    """Normalize top-level Evidence Package fields into graph state."""
    package = state['evidence_package']
    return {
        **state,
        'visited_nodes': _append_visit(state, 'ingest_evidence_package'),
        'case_id': package.get('case_id', ''),
        'alert_id': package.get('alert_id', ''),
        'tenant_id': package.get('tenant_id', ''),
        'reason_codes': list(package.get('reason_codes', [])),
    }


def validate_evidence_contract(state: InvestigationState) -> InvestigationState:
    """Check the minimal Evidence Package contract required by this seed graph."""
    package = state['evidence_package']
    required_keys = ['schema_version', 'case_id', 'tenant_id', 'required', 'collected', 'timeline', 'security']
    errors = [f'missing:{key}' for key in required_keys if key not in package]
    return {
        **state,
        'visited_nodes': _append_visit(state, 'validate_evidence_contract'),
        'contract_valid': not errors,
        'contract_errors': errors,
    }


def investigate_timeline(state: InvestigationState) -> InvestigationState:
    """Count and summarize timeline entries without inferring unsupported events."""
    timeline = state['evidence_package'].get('timeline', [])
    event_count = len(timeline)
    if event_count == 0:
        summary = 'No timeline events supplied; reviewer must request additional evidence.'
    else:
        first = timeline[0].get('event_type', 'unknown')
        last = timeline[-1].get('event_type', 'unknown')
        summary = f'{event_count} timeline events supplied from {first} to {last}.'
    return {
        **state,
        'visited_nodes': _append_visit(state, 'investigate_timeline'),
        'timeline_event_count': event_count,
        'timeline_summary': summary,
    }


def map_mitre_context(state: InvestigationState) -> InvestigationState:
    """Map conservative context hints from known reason codes."""
    reason_codes = set(state.get('reason_codes', []))
    context = []
    if 'privileged_account' in reason_codes:
        context.append('Credential Access or Privilege Escalation review recommended')
    if any(code.startswith('alert_family:login_anomaly') for code in reason_codes):
        context.append('Initial Access / Valid Accounts review recommended')
    if 'prompt_injection_quarantine' in reason_codes:
        context.append('AI guardrail abuse review recommended')
    return {
        **state,
        'visited_nodes': _append_visit(state, 'map_mitre_context'),
        'mitre_context': context,
    }


def assess_guardrails(state: InvestigationState) -> InvestigationState:
    """Enforce safety gates: human review required, no automation allowed."""
    security = state['evidence_package'].get('security', {})
    human_review_required = bool(security.get('human_review_required', True))
    return {
        **state,
        'visited_nodes': _append_visit(state, 'assess_guardrails'),
        'human_review_required': human_review_required,
        'automation_allowed': False,
        'response_action': 'none',
    }


def draft_human_review_brief(state: InvestigationState) -> InvestigationState:
    """Draft a bounded analyst brief from graph state."""
    package = state['evidence_package']
    collected = package.get('collected', [])
    missing = package.get('missing', [])
    brief = {
        'case_id': state.get('case_id'),
        'alert_id': state.get('alert_id'),
        'tenant_id': state.get('tenant_id'),
        'contract_valid': state.get('contract_valid', False),
        'contract_errors': state.get('contract_errors', []),
        'timeline_summary': state.get('timeline_summary', ''),
        'mitre_context': state.get('mitre_context', []),
        'collected_evidence_count': len(collected),
        'missing_evidence_count': len(missing),
        'citation_ids': [item.get('citation_id') for item in collected if item.get('citation_id')],
        'recommended_next_step': 'human_analyst_review',
        'response_action': 'none',
    }
    return {
        **state,
        'visited_nodes': _append_visit(state, 'draft_human_review_brief'),
        'review_brief': brief,
    }


def build_langgraph_app() -> Any:
    """Compile the actual LangGraph StateGraph for the seed investigation flow."""
    graph = StateGraph(InvestigationState)
    graph.add_node('ingest_evidence_package', ingest_evidence_package)
    graph.add_node('validate_evidence_contract', validate_evidence_contract)
    graph.add_node('investigate_timeline', investigate_timeline)
    graph.add_node('map_mitre_context', map_mitre_context)
    graph.add_node('assess_guardrails', assess_guardrails)
    graph.add_node('draft_human_review_brief', draft_human_review_brief)
    graph.set_entry_point('ingest_evidence_package')
    graph.add_edge('ingest_evidence_package', 'validate_evidence_contract')
    graph.add_edge('validate_evidence_contract', 'investigate_timeline')
    graph.add_edge('investigate_timeline', 'map_mitre_context')
    graph.add_edge('map_mitre_context', 'assess_guardrails')
    graph.add_edge('assess_guardrails', 'draft_human_review_brief')
    graph.add_edge('draft_human_review_brief', END)
    return graph.compile()


def run_seed_investigation_graph(fixture_path: Path) -> dict[str, Any]:
    """Run the compiled LangGraph seed over a local Evidence Package fixture."""
    package = json.loads(fixture_path.read_text(encoding='utf-8'))
    app = build_langgraph_app()
    final_state = app.invoke({'evidence_package': package, 'visited_nodes': []})
    return {
        'graph_id': GRAPH_ID,
        'case_id': final_state['case_id'],
        'visited_nodes': final_state['visited_nodes'],
        'final_state': {
            'contract_valid': final_state['contract_valid'],
            'timeline_event_count': final_state['timeline_event_count'],
            'reason_codes': final_state['reason_codes'],
            'human_review_required': final_state['human_review_required'],
            'automation_allowed': final_state['automation_allowed'],
            'response_action': final_state['response_action'],
            'review_brief': final_state['review_brief'],
        },
    }


def write_graph_spec(out_path: Path) -> None:
    """Write the LangGraph-compatible graph spec as JSON."""
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open('w', encoding='utf-8') as fp:
        json.dump(AgentGraphComposer().build_spec(), fp, ensure_ascii=False, indent=2)
        fp.write('\n')


def main() -> int:
    """CLI entry point for writing graph spec and running a fixture smoke test."""
    parser = argparse.ArgumentParser(description='Build and run AI SOC LangGraph composition seed.')
    parser.add_argument('--spec-out', default=str(ROOT / 'reports' / 'langgraph_agent_composition_v1.json'))
    parser.add_argument('--run-fixture', default=str(ROOT / 'fixtures' / 'vpn_login_anomaly_complete.evidence_package.json'))
    parser.add_argument('--run-out', default=str(ROOT / 'reports' / 'langgraph_seed_run_v1.json'))
    args = parser.parse_args()

    write_graph_spec(Path(args.spec_out))
    result = run_seed_investigation_graph(Path(args.run_fixture))
    run_out = Path(args.run_out)
    run_out.parent.mkdir(parents=True, exist_ok=True)
    with run_out.open('w', encoding='utf-8') as fp:
        json.dump(result, fp, ensure_ascii=False, indent=2)
        fp.write('\n')
    print(json.dumps({'spec_out': args.spec_out, 'run_out': args.run_out, 'result': result}, ensure_ascii=False, indent=2))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
