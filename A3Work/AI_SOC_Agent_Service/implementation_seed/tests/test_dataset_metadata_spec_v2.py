import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))

from dataset_registry import DatasetRegistry, load_dataset_manifest
from public_dataset_adapter import PublicDatasetAdapter


class DatasetMetadataSpecV2Test(unittest.TestCase):
    def test_public_sources_should_include_access_and_normalization_metadata_spec(self):
        manifest = load_dataset_manifest(ROOT / 'datasets' / 'dataset_manifest.json')
        public_sources = [source for source in manifest['sources'] if source['source_type'] == 'public']

        self.assertGreaterEqual(len(public_sources), 4)
        for source in public_sources:
            metadata_spec = source['metadata_spec']
            self.assertEqual(metadata_spec['spec_version'], '2.0')
            self.assertTrue(metadata_spec['access_review']['download_requires_approval'])
            self.assertTrue(metadata_spec['access_review']['license_review_required'])
            self.assertIn(metadata_spec['access_review']['pii_or_sensitive_risk'], {'low', 'medium', 'high'})
            self.assertIn('normalized_alert', metadata_spec['normalization_contract']['target_schemas'])
            self.assertIn('evidence_package', metadata_spec['normalization_contract']['target_schemas'])
            self.assertTrue(metadata_spec['raw_data_profile']['expected_formats'])
            self.assertTrue(metadata_spec['evaluation_use']['excluded_uses'])

    def test_should_build_source_metadata_spec_report_with_blocked_download_summary(self):
        registry = DatasetRegistry(ROOT / 'datasets' / 'dataset_manifest.json')
        report = registry.build_source_metadata_spec_report()

        self.assertEqual(report['schema_version'], '2.0')
        self.assertEqual(report['execution_mode'], 'metadata_only_no_download')
        self.assertGreaterEqual(report['summary']['public_sources'], 4)
        self.assertEqual(report['summary']['download_requires_approval'], report['summary']['public_sources'])
        self.assertGreaterEqual(report['summary']['high_or_medium_risk_sources'], 1)
        self.assertTrue(all(item['access_gate']['download_requires_approval'] for item in report['sources']))
        self.assertTrue(all('normalization_contract' in item for item in report['sources']))

    def test_public_dataset_case_specs_should_carry_metadata_spec_contract(self):
        registry = DatasetRegistry(ROOT / 'datasets' / 'dataset_manifest.json')
        source = registry.get_source('splunk-bots-v3')
        specs = PublicDatasetAdapter(source).to_case_specs()

        self.assertTrue(specs)
        for spec in specs:
            self.assertEqual(spec['metadata_spec_version'], '2.0')
            self.assertTrue(spec['access_gate']['download_requires_approval'])
            self.assertIn('bounded_query_scope', spec['expected_guardrails'])
            self.assertIn('normalization_contract', spec)
            self.assertIn('target_schemas', spec['normalization_contract'])

    def test_should_write_source_metadata_spec_report_to_json(self):
        registry = DatasetRegistry(ROOT / 'datasets' / 'dataset_manifest.json')
        with tempfile.TemporaryDirectory() as temp_dir:
            out_path = Path(temp_dir) / 'dataset_source_metadata_spec_v2.json'
            registry.write_source_metadata_spec_report(out_path)
            loaded = json.loads(out_path.read_text(encoding='utf-8'))

        self.assertEqual(loaded['schema_version'], '2.0')
        self.assertGreaterEqual(len(loaded['sources']), 4)


if __name__ == '__main__':
    unittest.main()
