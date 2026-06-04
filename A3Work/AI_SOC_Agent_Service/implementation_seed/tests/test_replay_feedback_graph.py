import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))

from replay_feedback_graph import (
    build_feedback_graph_spec,
    build_llm_backend_contract,
    render_feedback_mermaid_graph,
    run_offline_feedback_graph,
    write_feedback_report,
)


class ReplayFeedbackGraphTest(unittest.TestCase):
    def test_should_build_offline_feedback_graph_spec_with_replay_evaluation_module(self):
        spec = build_feedback_graph_spec()

        self.assertEqual(spec['schema_version'], '1.0')
        self.assertEqual(spec['graph_id'], 'ai_soc_replay_feedback_langgraph_seed_v1')
        self.assertEqual(spec['runtime_target'], 'langgraph_stategraph_compatible')
        self.assertEqual(spec['module_id'], 'replay_evaluation_agent')
        self.assertIn('load_replay_inputs', [node['id'] for node in spec['nodes']])
        self.assertIn('rank_next_module_improvements', [node['id'] for node in spec['nodes']])
        self.assertIn('no_live_llm_call_in_default_tests', spec['safety_invariants'])
        self.assertIn('local_llm_first_demo_oauth_fallback_allowed', spec['safety_invariants'])

    def test_should_define_local_first_llm_backend_contract_with_demo_oauth_fallback(self):
        contract = build_llm_backend_contract()

        self.assertEqual(contract['schema_version'], '1.0')
        self.assertEqual(contract['default_backend'], 'local_on_prem_llm')
        self.assertEqual(contract['demo_fallback_backend'], 'oauth_current_session_model')
        self.assertIn('gpt-5.5', contract['demo_fallback_models'])
        self.assertEqual(contract['execution_mode'], 'contract_only_no_live_call_by_default')
        self.assertTrue(contract['replacement_plan']['local_llm_replaces_demo_oauth'])
        self.assertIn('no_training_data_retention_assumption', contract['demo_fallback_constraints'])

    def test_should_run_offline_feedback_graph_without_live_llm_or_actions(self):
        result = run_offline_feedback_graph(
            replay_metrics_path=ROOT / 'reports' / 'replay_metrics_v1.json',
            langgraph_run_path=ROOT / 'reports' / 'langgraph_seed_run_v1.json',
            module_catalog_path=ROOT / 'reports' / 'agent_module_catalog_v1.json',
        )

        self.assertEqual(result['graph_id'], 'ai_soc_replay_feedback_langgraph_seed_v1')
        self.assertEqual(result['llm_backend_contract']['selected_for_seed'], 'none_dry_run')
        self.assertEqual(result['llm_backend_contract']['demo_fallback_backend'], 'oauth_current_session_model')
        self.assertEqual(result['go_decision']['decision'], 'go_for_next_seed')
        self.assertEqual(result['safety_summary']['response_action'], 'none')
        self.assertEqual(result['safety_summary']['live_llm_called'], False)
        self.assertEqual(result['safety_summary']['soc_connector_called'], False)
        self.assertIn('replay_evaluation_agent', result['module_improvement_ranking'][0]['module_id'])

    def test_should_render_and_write_feedback_artifacts(self):
        spec = build_feedback_graph_spec()
        mermaid = render_feedback_mermaid_graph(spec)
        self.assertTrue(mermaid.startswith('flowchart TD'))
        self.assertIn('load_replay_inputs --> evaluate_replay_quality', mermaid)
        self.assertIn('rank_next_module_improvements --> END', mermaid)

        result = run_offline_feedback_graph(
            replay_metrics_path=ROOT / 'reports' / 'replay_metrics_v1.json',
            langgraph_run_path=ROOT / 'reports' / 'langgraph_seed_run_v1.json',
            module_catalog_path=ROOT / 'reports' / 'agent_module_catalog_v1.json',
        )
        with tempfile.TemporaryDirectory() as temp_dir:
            out_path = Path(temp_dir) / 'feedback.json'
            write_feedback_report(result, out_path)
            loaded = json.loads(out_path.read_text(encoding='utf-8'))

        self.assertEqual(loaded['graph_id'], result['graph_id'])
        self.assertEqual(loaded['safety_summary']['live_llm_called'], False)


if __name__ == '__main__':
    unittest.main()
