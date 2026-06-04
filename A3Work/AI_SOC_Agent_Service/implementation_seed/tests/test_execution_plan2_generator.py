import json
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))

from execution_plan2_generator import (
    build_execution_plan2_sections,
    render_execution_plan2_markdown,
    write_execution_plan2_artifacts,
)


class ExecutionPlan2GeneratorTest(unittest.TestCase):
    def _metadata_report(self):
        return {
            'schema_version': '2.0',
            'execution_mode': 'metadata_only_no_download',
            'summary': {
                'public_sources': 4,
                'download_requires_approval': 4,
                'high_or_medium_risk_sources': 3,
            },
            'sources': [
                {
                    'source_id': 'splunk-bots-v3',
                    'display_name': 'Splunk Boss of the SOC v3',
                    'access_gate': {
                        'download_requires_approval': True,
                        'license_review_required': True,
                        'pii_or_sensitive_risk': 'medium',
                    },
                    'normalization_contract': {
                        'target_schemas': ['normalized_alert', 'evidence_package'],
                        'required_mappings': ['timestamp', 'host', 'user', 'indicator'],
                    },
                    'evaluation_use': {
                        'primary_metrics': ['citation_coverage', 'case_summary_quality'],
                        'excluded_uses': ['autonomous_response'],
                    },
                }
            ],
        }

    def _replay_metrics(self):
        return {
            'schema_version': '1.0',
            'summary': {
                'total_cases': 4,
                'tenant_leakage_count': 0,
                'unsupported_conclusion_count': 0,
            },
            'metrics': {
                'evidence_package_success_rate': 1.0,
                'missing_reason_coverage': 1.0,
            },
            'go_decision': {'decision': 'go_for_next_seed', 'reasons': ['all_seed_quality_gates_passed']},
        }

    def test_should_build_execution_plan2_sections_from_metadata_spec_and_replay_metrics(self):
        sections = build_execution_plan2_sections(self._metadata_report(), self._replay_metrics())

        self.assertEqual(sections['plan_version'], '2.0')
        self.assertIn('public_dataset_metadata_spec_v2', sections['scope']['inputs'])
        self.assertEqual(sections['safety_gates']['download_gate'], 'blocked_until_explicit_approval')
        self.assertEqual(sections['safety_gates']['response_gate'], 'human_review_first')
        self.assertGreaterEqual(len(sections['workstreams']), 4)
        self.assertTrue(any(item['id'] == 'WS-01' for item in sections['workstreams']))
        self.assertTrue(any(item['id'] == 'M1' for item in sections['milestones']))

    def test_should_render_execution_plan2_markdown_with_dataset_and_agent_gates(self):
        sections = build_execution_plan2_sections(self._metadata_report(), self._replay_metrics())
        markdown = render_execution_plan2_markdown(sections)

        self.assertIn('# AI 보안관제 에이전트 실행계획 #2', markdown)
        self.assertIn('metadata_only_no_download', markdown)
        self.assertIn('Policy Gate', markdown)
        self.assertIn('Evidence Package', markdown)
        self.assertIn('Human Review', markdown)
        self.assertIn('splunk-bots-v3', markdown)

    def test_should_write_execution_plan2_markdown_docx_and_summary_json(self):
        sections = build_execution_plan2_sections(self._metadata_report(), self._replay_metrics())
        with tempfile.TemporaryDirectory() as temp_dir:
            out_dir = Path(temp_dir)
            artifacts = write_execution_plan2_artifacts(sections, out_dir, out_dir / 'docx')
            summary = json.loads(artifacts['summary_json'].read_text(encoding='utf-8'))

            self.assertTrue(artifacts['markdown'].exists())
            self.assertTrue(artifacts['docx'].exists())
            self.assertEqual(summary['plan_version'], '2.0')
            with zipfile.ZipFile(artifacts['docx']) as archive:
                self.assertIn('word/document.xml', archive.namelist())
                self.assertIn('word/styles.xml', archive.namelist())


if __name__ == '__main__':
    unittest.main()
