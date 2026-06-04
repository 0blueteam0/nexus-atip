import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))

from langgraph_agent_composition import (
    AgentGraphComposer,
    build_langgraph_app,
    render_mermaid_graph,
    run_seed_investigation_graph,
    write_graph_spec,
    write_mermaid_graph,
)


class LangGraphAgentCompositionTest(unittest.TestCase):
    def test_should_build_langgraph_compatible_soc_agent_topology(self):
        spec = AgentGraphComposer().build_spec()

        self.assertEqual(spec['schema_version'], '1.0')
        self.assertEqual(spec['runtime_target'], 'langgraph_stategraph_compatible')
        self.assertFalse(spec['requires_langgraph_install_for_seed_tests'])
        node_ids = {node['id'] for node in spec['nodes']}
        self.assertEqual(
            node_ids,
            {
                'ingest_evidence_package',
                'validate_evidence_contract',
                'investigate_timeline',
                'map_mitre_context',
                'assess_guardrails',
                'draft_human_review_brief',
            },
        )
        self.assertIn(
            {'from': 'assess_guardrails', 'to': 'draft_human_review_brief', 'condition': 'always_requires_human_review'},
            spec['edges'],
        )
        self.assertIn('no_autonomous_response', spec['safety_invariants'])
        self.assertIn('human_review_required', spec['state_contract']['required_output_fields'])

    def test_should_run_seed_investigation_graph_over_fixture_without_actions(self):
        fixture_path = ROOT / 'fixtures' / 'vpn_login_anomaly_complete.evidence_package.json'
        result = run_seed_investigation_graph(fixture_path)

        self.assertEqual(result['graph_id'], 'ai_soc_investigation_langgraph_seed_v1')
        self.assertEqual(result['case_id'], 'CASE-770487')
        self.assertEqual(result['final_state']['automation_allowed'], False)
        self.assertEqual(result['final_state']['human_review_required'], True)
        self.assertEqual(result['final_state']['response_action'], 'none')
        self.assertGreaterEqual(result['final_state']['timeline_event_count'], 1)
        self.assertIn('privileged_account', result['final_state']['reason_codes'])
        self.assertIn('draft_human_review_brief', result['visited_nodes'])

    def test_should_compile_and_invoke_actual_langgraph_app(self):
        fixture_path = ROOT / 'fixtures' / 'vpn_login_anomaly_complete.evidence_package.json'
        package = json.loads(fixture_path.read_text(encoding='utf-8'))
        app = build_langgraph_app()
        result = app.invoke({'evidence_package': package, 'visited_nodes': []})

        self.assertEqual(result['case_id'], 'CASE-770487')
        self.assertEqual(result['automation_allowed'], False)
        self.assertEqual(result['human_review_required'], True)
        self.assertEqual(result['response_action'], 'none')
        self.assertIn('draft_human_review_brief', result['visited_nodes'])

    def test_should_write_graph_spec_to_json_file(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            out_path = Path(temp_dir) / 'langgraph_agent_composition_v1.json'
            write_graph_spec(out_path)
            loaded = json.loads(out_path.read_text(encoding='utf-8'))

        self.assertEqual(loaded['graph_id'], 'ai_soc_investigation_langgraph_seed_v1')
        self.assertEqual(loaded['runtime_target'], 'langgraph_stategraph_compatible')

    def test_should_render_reviewable_mermaid_graph_from_spec(self):
        spec = AgentGraphComposer().build_spec()
        mermaid = render_mermaid_graph(spec)

        self.assertTrue(mermaid.startswith('flowchart TD'))
        self.assertIn('START --> ingest_evidence_package', mermaid)
        self.assertIn('assess_guardrails --> draft_human_review_brief', mermaid)
        self.assertIn('draft_human_review_brief --> END', mermaid)
        self.assertIn('classDef safety', mermaid)
        self.assertIn('class assess_guardrails safety', mermaid)

    def test_should_write_mermaid_graph_artifact(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            out_path = Path(temp_dir) / 'langgraph_agent_composition_v1.mmd'
            write_mermaid_graph(out_path)
            mermaid = out_path.read_text(encoding='utf-8')

        self.assertIn('flowchart TD', mermaid)
        self.assertIn('validate_evidence_contract', mermaid)
        self.assertIn('human review required', mermaid)


if __name__ == '__main__':
    unittest.main()
