import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))

from agent_module_catalog import (
    build_agent_module_catalog,
    build_langgraph_node_module_map,
    build_module_assurance,
    render_module_mermaid,
    write_module_catalog,
    write_module_mermaid,
)
from langgraph_agent_composition import AgentGraphComposer


class AgentModuleCatalogTest(unittest.TestCase):
    def test_should_define_reviewable_soc_agent_modules(self):
        catalog = build_agent_module_catalog()

        self.assertEqual(catalog['schema_version'], '1.0')
        self.assertEqual(catalog['catalog_id'], 'ai_soc_agent_module_catalog_v1')
        module_ids = {module['id'] for module in catalog['modules']}
        self.assertEqual(
            module_ids,
            {
                'evidence_intake_agent',
                'evidence_contract_agent',
                'timeline_investigation_agent',
                'mitre_context_agent',
                'policy_guardrail_agent',
                'analyst_brief_agent',
                'replay_evaluation_agent',
            },
        )
        self.assertIn('production_siem_query', catalog['execution_boundary']['forbidden_now'])
        self.assertIn('human_review_before_any_response_action', catalog['quality_gates'])

    def test_should_map_langgraph_nodes_to_module_owners(self):
        graph_spec = AgentGraphComposer().build_spec()
        mapping = build_langgraph_node_module_map()

        self.assertEqual(mapping['ingest_evidence_package'], 'evidence_intake_agent')
        self.assertEqual(mapping['validate_evidence_contract'], 'evidence_contract_agent')
        self.assertEqual(mapping['assess_guardrails'], 'policy_guardrail_agent')
        self.assertEqual(mapping['draft_human_review_brief'], 'analyst_brief_agent')
        self.assertEqual({node['id'] for node in graph_spec['nodes']}, set(mapping.keys()))

    def test_should_build_module_assurance_for_graph_spec(self):
        graph_spec = AgentGraphComposer().build_spec()
        assurance = build_module_assurance(graph_spec)

        self.assertTrue(assurance['all_langgraph_nodes_have_module_owner'])
        self.assertEqual(assurance['missing_module_owner'], [])
        self.assertEqual(assurance['orphan_non_evaluation_modules'], [])
        self.assertIn('policy_guardrail_agent', assurance['deterministic_required_modules'])

    def test_should_render_module_mermaid_with_safety_and_evaluation_classes(self):
        mermaid = render_module_mermaid()

        self.assertTrue(mermaid.startswith('flowchart TD'))
        self.assertIn('evidence_intake_agent --> evidence_contract_agent', mermaid)
        self.assertIn('policy_guardrail_agent --> analyst_brief_agent', mermaid)
        self.assertIn('analyst_brief_agent --> replay_evaluation_agent', mermaid)
        self.assertIn('class policy_guardrail_agent safety', mermaid)
        self.assertIn('class replay_evaluation_agent evaluation', mermaid)

    def test_should_write_catalog_artifacts(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            catalog_path = Path(temp_dir) / 'agent_module_catalog_v1.json'
            mermaid_path = Path(temp_dir) / 'agent_module_catalog_v1.mmd'
            write_module_catalog(catalog_path)
            write_module_mermaid(mermaid_path)
            catalog = json.loads(catalog_path.read_text(encoding='utf-8'))
            mermaid = mermaid_path.read_text(encoding='utf-8')

        self.assertEqual(catalog['catalog_id'], 'ai_soc_agent_module_catalog_v1')
        self.assertIn('flowchart TD', mermaid)
        self.assertIn('no autonomous response', mermaid)


if __name__ == '__main__':
    unittest.main()
