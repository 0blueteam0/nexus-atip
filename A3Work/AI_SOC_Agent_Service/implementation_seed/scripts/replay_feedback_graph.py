"""Offline replay feedback LangGraph seed for AI SOC module evolution.

이 파일은 AI SOC 멀티 에이전트 구조에서 `replay_evaluation_agent`를
하나의 독립적인 LangGraph workflow로 승격시키기 위한 seed 구현이다.

핵심 의도:
1. 현재 단계에서는 replay metrics / LangGraph 실행 리포트 / module catalog만 읽는다.
2. 실제 LLM, SIEM, EDR, SOAR, IAM, CMDB connector는 절대 호출하지 않는다.
3. 운영 환경의 최종 LLM backend는 온프레미스 local LLM이라고 명시한다.
4. 데모 환경에서는 local LLM이 준비되기 전까지 OAuth 기반 현재 모델을
   “계약상 fallback 후보”로만 둔다. 기본 테스트에서는 live call을 하지 않는다.
5. 사용자가 나중에 각 node와 module backend를 직접 fine-tuning할 수 있도록
   상태 입력/출력, 안전 gate, backend 교체 boundary를 코드 안에 명시적으로 남긴다.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, TypedDict

from langgraph.graph import END, StateGraph

ROOT = Path(__file__).resolve().parents[1]
GRAPH_ID = 'ai_soc_replay_feedback_langgraph_seed_v1'


class FeedbackState(TypedDict, total=False):
    """State for offline replay feedback graph.

    LangGraph의 StateGraph는 node 사이에서 하나의 dict-like state를 전달한다.
    아래 필드는 사용자가 나중에 multi-agent 세분화 또는 local LLM backend를 붙일 때
    어느 node가 어떤 정보를 읽고 쓰는지 추적하기 위한 명시적 계약이다.

    파인튜닝 포인트:
    - `replay_quality`: replay metric을 더 세밀한 품질 점수로 확장 가능
    - `graph_assurance_summary`: graph path, module ownership 외에 latency/cost/coverage 추가 가능
    - `llm_backend_contract`: local LLM, vLLM, Ollama, llama.cpp 등으로 교체할 adapter 계약
    - `module_improvement_ranking`: 다음에 어떤 agent module을 개선할지 우선순위 산정 로직
    """

    replay_metrics: dict[str, Any]
    langgraph_run: dict[str, Any]
    module_catalog: dict[str, Any]
    visited_nodes: list[str]
    llm_backend_contract: dict[str, Any]
    replay_quality: dict[str, Any]
    graph_assurance_summary: dict[str, Any]
    go_decision: dict[str, Any]
    module_improvement_ranking: list[dict[str, Any]]
    safety_summary: dict[str, Any]


def build_llm_backend_contract() -> dict[str, Any]:
    """Describe local-first LLM policy and demo OAuth fallback without making a live call.

    중요: 이 함수는 LLM을 호출하지 않는다. “어떤 backend를 써도 되는지”만 선언한다.
    따라서 테스트와 artifact 생성은 네트워크/API/OAuth 상태에 의존하지 않는다.

    운영 설계 원칙:
    - production/on-premise: `local_on_prem_llm`이 정답 backend다.
    - demo: local model이 준비되기 전까지만 `oauth_current_session_model`을 fallback 후보로 둔다.
    - fallback 후보에는 현재 대화 모델인 GPT-5.5 계열을 포함하지만, synthetic/redacted demo에 한정한다.
    - 향후 local LLM을 붙일 때는 이 contract의 `adapter_boundary` 아래 구현만 교체한다.
    """
    return {
        'schema_version': '1.0',
        'default_backend': 'local_on_prem_llm',
        'demo_fallback_backend': 'oauth_current_session_model',
        'demo_fallback_models': ['gpt-5.5', 'current_hermes_oauth_model'],
        'selected_for_seed': 'none_dry_run',
        'execution_mode': 'contract_only_no_live_call_by_default',
        'allowed_demo_use': [
            'non-production analyst brief style rehearsal',
            'offline replay feedback wording draft',
            'module improvement ideation from redacted deterministic reports',
        ],
        'forbidden_demo_use': [
            'production SOC decisioning',
            'tenant-sensitive raw log upload',
            'autonomous response action recommendation',
            'training or fine-tuning on customer data without approval',
        ],
        'demo_fallback_constraints': [
            'redacted_or_synthetic_inputs_only',
            'no_training_data_retention_assumption',
            'human_review_required',
            'no_live_call_in_default_tests',
            'local_llm_replacement_required_before_on_prem_production',
        ],
        'replacement_plan': {
            'local_llm_replaces_demo_oauth': True,
            'target_environment': 'on_premise_local_model',
            'adapter_boundary': 'module_backend_contract',
            'expected_local_backends': ['ollama_openai_compatible', 'vllm_openai_compatible', 'llama_cpp_server'],
        },
    }


def build_feedback_graph_spec() -> dict[str, Any]:
    """Return a serializable offline feedback graph spec.

    이 spec은 실제 LangGraph app과 별개로 reviewer/사용자가 workflow를 검토하기 위한
    JSON 계약이다. 나중에 graph node를 늘리거나 agent module을 분리할 때는
    먼저 이 spec에 node/edge/state contract를 추가하고, 그 다음 실제 StateGraph 구현을
    맞추는 순서가 안전하다.
    """
    return {
        'schema_version': '1.0',
        'graph_id': GRAPH_ID,
        'runtime_target': 'langgraph_stategraph_compatible',
        'module_id': 'replay_evaluation_agent',
        'state_contract': {
            'input_fields': ['replay_metrics', 'langgraph_run', 'module_catalog', 'visited_nodes'],
            'required_output_fields': [
                'go_decision',
                'module_improvement_ranking',
                'llm_backend_contract',
                'safety_summary',
            ],
        },
        'nodes': [
            {
                'id': 'load_replay_inputs',
                'role': 'offline_input_loader',
                'module_id': 'replay_evaluation_agent',
                'description': 'Load replay metrics, LangGraph run assurance, and module catalog artifacts.',
            },
            {
                'id': 'evaluate_replay_quality',
                'role': 'quality_gate_evaluator',
                'module_id': 'replay_evaluation_agent',
                'description': 'Summarize replay quality metrics and current go/hold/no-go decision.',
            },
            {
                'id': 'evaluate_graph_assurance',
                'role': 'graph_assurance_evaluator',
                'module_id': 'replay_evaluation_agent',
                'description': 'Check LangGraph path and module ownership assurance from the run report.',
            },
            {
                'id': 'select_llm_backend_policy',
                'role': 'llm_backend_policy_gate',
                'module_id': 'replay_evaluation_agent',
                'description': 'Declare local LLM first policy and demo OAuth fallback contract without live LLM calls.',
            },
            {
                'id': 'rank_next_module_improvements',
                'role': 'next_seed_planner',
                'module_id': 'replay_evaluation_agent',
                'description': 'Rank module improvement candidates for the next foreground seed increment.',
            },
        ],
        'edges': [
            {'from': 'START', 'to': 'load_replay_inputs', 'condition': 'artifacts_present'},
            {'from': 'load_replay_inputs', 'to': 'evaluate_replay_quality', 'condition': 'inputs_loaded'},
            {'from': 'evaluate_replay_quality', 'to': 'evaluate_graph_assurance', 'condition': 'quality_summarized'},
            {'from': 'evaluate_graph_assurance', 'to': 'select_llm_backend_policy', 'condition': 'assurance_summarized'},
            {'from': 'select_llm_backend_policy', 'to': 'rank_next_module_improvements', 'condition': 'llm_policy_declared'},
            {'from': 'rank_next_module_improvements', 'to': 'END', 'condition': 'feedback_ready'},
        ],
        'safety_invariants': [
            'no_autonomous_response',
            'no_soc_connector_call',
            'no_live_llm_call_in_default_tests',
            'local_llm_first_demo_oauth_fallback_allowed',
            'demo_oauth_fallback_requires_redacted_or_synthetic_inputs',
            'human_review_required_before_next_seed_expansion',
        ],
    }


def _append_visit(state: FeedbackState, node_id: str) -> list[str]:
    # 각 node가 실제로 실행되었는지 확인하기 위한 deterministic trace다.
    # LangGraph workflow를 fine-tuning하다 보면 edge 조건 변경으로 node가 빠질 수 있으므로,
    # 테스트에서는 이 visited_nodes 목록을 통해 선언된 경로와 실제 경로를 비교한다.
    return [*state.get('visited_nodes', []), node_id]


def load_replay_inputs(state: FeedbackState) -> FeedbackState:
    """Mark offline artifacts as loaded."""
    return {**state, 'visited_nodes': _append_visit(state, 'load_replay_inputs')}


def evaluate_replay_quality(state: FeedbackState) -> FeedbackState:
    """Summarize replay metrics and pass through the deterministic go decision.

    이 node는 replay_runner 결과를 읽고 “다음 seed로 진행해도 되는가”를 요약한다.
    지금은 deterministic metric만 사용하지만, 향후에는 local LLM이 실패 사례를 자연어로
    분류하거나 analyst feedback을 요약하는 backend가 붙을 수 있다. 단, 그 경우에도
    tenant leakage / unsupported conclusion / prompt injection 같은 안전 metric은
    LLM 판단이 아니라 deterministic gate로 유지해야 한다.
    """
    replay_metrics = state['replay_metrics']
    quality = {
        'total_cases': replay_metrics.get('summary', {}).get('total_cases', 0),
        'tenant_leakage_count': replay_metrics.get('summary', {}).get('tenant_leakage_count', 0),
        'unsupported_conclusion_count': replay_metrics.get('summary', {}).get('unsupported_conclusion_count', 0),
        'metrics': replay_metrics.get('metrics', {}),
    }
    return {
        **state,
        'visited_nodes': _append_visit(state, 'evaluate_replay_quality'),
        'replay_quality': quality,
        'go_decision': replay_metrics.get('go_decision', {'decision': 'hold', 'reasons': ['missing_go_decision']}),
    }


def evaluate_graph_assurance(state: FeedbackState) -> FeedbackState:
    """Summarize LangGraph execution assurance from the previous run report."""
    assurance = state['langgraph_run'].get('execution_assurance', {})
    module_assurance = assurance.get('module_assurance', {})
    summary = {
        'visited_path_matches_spec': bool(assurance.get('visited_path_matches_spec')),
        'all_langgraph_nodes_have_module_owner': bool(module_assurance.get('all_langgraph_nodes_have_module_owner')),
        'missing_required_nodes': assurance.get('missing_required_nodes', []),
        'missing_module_owner': module_assurance.get('missing_module_owner', []),
    }
    return {
        **state,
        'visited_nodes': _append_visit(state, 'evaluate_graph_assurance'),
        'graph_assurance_summary': summary,
    }


def select_llm_backend_policy(state: FeedbackState) -> FeedbackState:
    """Attach the local-first LLM backend contract without calling an LLM.

    이 node는 사용자가 질문한 “데모에서는 현재 OAuth 모델로 대체 가능한가?”에 대한
    코드상 답변이다. 가능은 하되, 여기서는 실행하지 않고 contract만 남긴다.
    나중에 실제 demo call을 붙일 경우에도 이 node 뒤에 별도 adapter node를 두고,
    redaction/human-review/no-action gate를 통과한 synthetic 입력만 전달해야 한다.
    """
    return {
        **state,
        'visited_nodes': _append_visit(state, 'select_llm_backend_policy'),
        'llm_backend_contract': build_llm_backend_contract(),
    }


def rank_next_module_improvements(state: FeedbackState) -> FeedbackState:
    """Rank next module improvements from deterministic metrics and assurance.

    이 node는 “다음에 어떤 agent module을 foreground로 크게 개선할지”를 정한다.
    현재 ranking은 seed 수준의 deterministic rule이지만, 사용자가 fine-tuning할 때
    가장 자주 바꾸게 될 영역이다.

    파인튜닝 예시:
    - analyst_brief_agent를 우선해서 local LLM prompt contract를 만들기
    - timeline_investigation_agent에 temporal reasoning benchmark 추가하기
    - mitre_context_agent에 retrieval/citation contract를 붙이기
    - replay_evaluation_agent에 실패 case clustering과 regression dashboard 추가하기
    """
    replay_quality = state.get('replay_quality', {})
    graph_assurance = state.get('graph_assurance_summary', {})
    metrics = replay_quality.get('metrics', {})
    modules = {module['id']: module for module in state['module_catalog'].get('modules', [])}
    ranking = [
        {
            'module_id': 'replay_evaluation_agent',
            'priority': 1,
            'reason': 'Promote offline go/hold/no-go feedback into a first-class graph before adding live model backends.',
            'current_signal': state.get('go_decision', {}).get('decision', 'unknown'),
            'next_action': 'consume replay and LangGraph run reports to recommend next module backend expansion',
        },
        {
            'module_id': 'analyst_brief_agent',
            'priority': 2,
            'reason': 'LLM-assisted drafting can be demoed after citation gates, but local LLM must be the production target.',
            'current_signal': 'template_renderer_only',
            'next_action': 'add redacted prompt contract and deterministic fixture-based output checks',
        },
        {
            'module_id': 'timeline_investigation_agent',
            'priority': 3,
            'reason': 'Timeline quality directly affects analyst brief usefulness and replay scoring.',
            'current_signal': f"evidence_completeness={metrics.get('average_evidence_completeness', 'unknown')}",
            'next_action': 'add richer temporal assertions before any LLM summarizer backend',
        },
        {
            'module_id': 'mitre_context_agent',
            'priority': 4,
            'reason': 'Context mapping is bounded today; later retrieval must remain citation-gated.',
            'current_signal': f"path_assurance={graph_assurance.get('visited_path_matches_spec', False)}",
            'next_action': 'expand reason-code mapping and prepare retrieval contract',
        },
    ]
    ranking = [item for item in ranking if item['module_id'] in modules]
    safety_summary = {
        'response_action': 'none',
        'live_llm_called': False,
        'soc_connector_called': False,
        'human_review_required': True,
        'local_llm_is_production_target': True,
        'demo_oauth_model_allowed_for_redacted_demo_only': True,
    }
    return {
        **state,
        'visited_nodes': _append_visit(state, 'rank_next_module_improvements'),
        'module_improvement_ranking': ranking,
        'safety_summary': safety_summary,
    }


def build_feedback_langgraph_app() -> Any:
    """Compile the offline replay feedback StateGraph.

    이 함수가 실제 LangGraph runtime을 구성하는 중심점이다.
    새 agent node를 추가할 때는 아래 순서를 지킨다.
    1. `build_feedback_graph_spec()`에 node/edge/state contract 추가
    2. node 함수 구현
    3. `graph.add_node()` 등록
    4. `graph.add_edge()`로 실행 순서 연결
    5. visited_nodes와 output artifact를 검증하는 테스트 추가
    """
    graph = StateGraph(FeedbackState)
    graph.add_node('load_replay_inputs', load_replay_inputs)
    graph.add_node('evaluate_replay_quality', evaluate_replay_quality)
    graph.add_node('evaluate_graph_assurance', evaluate_graph_assurance)
    graph.add_node('select_llm_backend_policy', select_llm_backend_policy)
    graph.add_node('rank_next_module_improvements', rank_next_module_improvements)
    graph.set_entry_point('load_replay_inputs')
    graph.add_edge('load_replay_inputs', 'evaluate_replay_quality')
    graph.add_edge('evaluate_replay_quality', 'evaluate_graph_assurance')
    graph.add_edge('evaluate_graph_assurance', 'select_llm_backend_policy')
    graph.add_edge('select_llm_backend_policy', 'rank_next_module_improvements')
    graph.add_edge('rank_next_module_improvements', END)
    return graph.compile()


def run_offline_feedback_graph(
    replay_metrics_path: Path,
    langgraph_run_path: Path,
    module_catalog_path: Path,
) -> dict[str, Any]:
    """Run the offline feedback graph over existing local report artifacts.

    이 public API는 테스트와 CLI가 함께 사용하는 실행 진입점이다.
    입력은 모두 로컬 JSON artifact이며, 외부 API나 운영망 connector를 호출하지 않는다.
    나중에 demo OAuth LLM 또는 local LLM backend를 연결하더라도 이 함수의 입력 계약은
    “redacted/synthetic artifact를 graph state로 넣는다”는 형태로 유지하는 것이 안전하다.
    """
    replay_metrics = json.loads(replay_metrics_path.read_text(encoding='utf-8'))
    langgraph_run = json.loads(langgraph_run_path.read_text(encoding='utf-8'))
    module_catalog = json.loads(module_catalog_path.read_text(encoding='utf-8'))
    app = build_feedback_langgraph_app()
    final_state = app.invoke(
        {
            'replay_metrics': replay_metrics,
            'langgraph_run': langgraph_run,
            'module_catalog': module_catalog,
            'visited_nodes': [],
        }
    )
    return {
        'schema_version': '1.0',
        'graph_id': GRAPH_ID,
        'visited_nodes': final_state['visited_nodes'],
        'go_decision': final_state['go_decision'],
        'replay_quality': final_state['replay_quality'],
        'graph_assurance_summary': final_state['graph_assurance_summary'],
        'llm_backend_contract': final_state['llm_backend_contract'],
        'module_improvement_ranking': final_state['module_improvement_ranking'],
        'safety_summary': final_state['safety_summary'],
    }


def render_feedback_mermaid_graph(spec: dict[str, Any] | None = None) -> str:
    """Render feedback graph spec as Mermaid."""
    graph_spec = spec or build_feedback_graph_spec()
    lines = [
        'flowchart TD',
        '  %% AI SOC offline replay feedback graph: local LLM first, demo OAuth fallback contract only',
    ]
    for edge in graph_spec['edges']:
        lines.append(f"  {edge['from']} --> {edge['to']}")
        lines.append(f"  %% condition: {edge['from']} -> {edge['to']}: {edge['condition'].replace('_', ' ')}")
    lines.extend(
        [
            '  classDef llm fill:#302b1d,stroke:#ffd43b,color:#ffffff,stroke-width:2px',
            '  classDef safety fill:#3b1d1d,stroke:#ff6b6b,color:#ffffff,stroke-width:2px',
            '  class select_llm_backend_policy llm',
            '  class rank_next_module_improvements safety',
            '  %% invariant: no live LLM call; no SOC connector; response_action=none',
        ]
    )
    return '\n'.join(lines) + '\n'


def write_feedback_report(report: dict[str, Any], out_path: Path) -> None:
    """Write feedback report JSON."""
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open('w', encoding='utf-8') as fp:
        json.dump(report, fp, ensure_ascii=False, indent=2)
        fp.write('\n')


def write_feedback_graph_spec(out_path: Path) -> None:
    """Write feedback graph spec JSON."""
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open('w', encoding='utf-8') as fp:
        json.dump(build_feedback_graph_spec(), fp, ensure_ascii=False, indent=2)
        fp.write('\n')


def write_feedback_mermaid(out_path: Path) -> None:
    """Write feedback graph Mermaid artifact."""
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(render_feedback_mermaid_graph(), encoding='utf-8')


def main() -> int:
    """CLI entry point for offline replay feedback graph artifacts."""
    parser = argparse.ArgumentParser(description='Run AI SOC offline replay feedback LangGraph seed.')
    parser.add_argument('--replay-metrics', default=str(ROOT / 'reports' / 'replay_metrics_v1.json'))
    parser.add_argument('--langgraph-run', default=str(ROOT / 'reports' / 'langgraph_seed_run_v1.json'))
    parser.add_argument('--module-catalog', default=str(ROOT / 'reports' / 'agent_module_catalog_v1.json'))
    parser.add_argument('--spec-out', default=str(ROOT / 'reports' / 'replay_feedback_graph_v1.json'))
    parser.add_argument('--mermaid-out', default=str(ROOT / 'reports' / 'replay_feedback_graph_v1.mmd'))
    parser.add_argument('--report-out', default=str(ROOT / 'reports' / 'replay_feedback_report_v1.json'))
    args = parser.parse_args()

    write_feedback_graph_spec(Path(args.spec_out))
    write_feedback_mermaid(Path(args.mermaid_out))
    report = run_offline_feedback_graph(
        replay_metrics_path=Path(args.replay_metrics),
        langgraph_run_path=Path(args.langgraph_run),
        module_catalog_path=Path(args.module_catalog),
    )
    write_feedback_report(report, Path(args.report_out))
    print(
        json.dumps(
            {
                'spec_out': args.spec_out,
                'mermaid_out': args.mermaid_out,
                'report_out': args.report_out,
                'result': report,
            },
            ensure_ascii=False,
            indent=2,
        )
    )
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
