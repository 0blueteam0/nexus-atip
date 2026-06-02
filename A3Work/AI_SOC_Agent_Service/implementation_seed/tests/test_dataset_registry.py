import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))

from dataset_registry import DatasetRegistry, load_dataset_manifest, validate_dataset_manifest
from public_dataset_adapter import PublicDatasetAdapter


class DatasetRegistryTest(unittest.TestCase):
    def test_should_load_and_validate_dataset_manifest(self):
        manifest = load_dataset_manifest(ROOT / 'datasets' / 'dataset_manifest.json')
        validate_dataset_manifest(manifest)

        self.assertEqual(manifest['schema_version'], '1.0')
        self.assertGreaterEqual(len(manifest['sources']), 5)
        self.assertTrue(any(source['source_id'] == 'synthetic-v0' for source in manifest['sources']))
        self.assertTrue(any(source['source_id'] == 'otrf-security-datasets' for source in manifest['sources']))

    def test_should_list_only_enabled_sources_when_requested(self):
        registry = DatasetRegistry(ROOT / 'datasets' / 'dataset_manifest.json')
        enabled = registry.list_enabled_sources()

        self.assertTrue(enabled)
        self.assertTrue(all(source['enabled'] for source in enabled))
        self.assertIn('synthetic-v0', {source['source_id'] for source in enabled})

    def test_should_build_safe_replay_plan_without_downloading_public_data(self):
        registry = DatasetRegistry(ROOT / 'datasets' / 'dataset_manifest.json')
        plan = registry.build_replay_plan()

        self.assertEqual(plan['schema_version'], '1.0')
        self.assertEqual(plan['execution_mode'], 'metadata_only_no_download')
        self.assertGreaterEqual(plan['summary']['total_sources'], 5)
        self.assertGreaterEqual(plan['summary']['public_sources'], 4)
        self.assertIn('dataset_readiness', plan['summary'])
        self.assertTrue(all(item['download_allowed'] is False for item in plan['sources'] if item['source_type'] == 'public'))

    def test_should_reject_manifest_with_missing_source_id(self):
        manifest = load_dataset_manifest(ROOT / 'datasets' / 'dataset_manifest.json')
        broken = json.loads(json.dumps(manifest))
        del broken['sources'][0]['source_id']

        with self.assertRaises(Exception):
            validate_dataset_manifest(broken)

    def test_should_generate_public_dataset_adapter_stub_case_specs(self):
        registry = DatasetRegistry(ROOT / 'datasets' / 'dataset_manifest.json')
        source = registry.get_source('otrf-security-datasets')
        adapter = PublicDatasetAdapter(source)
        specs = adapter.to_case_specs()

        self.assertGreaterEqual(len(specs), 1)
        self.assertTrue(all(spec['adapter_mode'] == 'metadata_stub' for spec in specs))
        self.assertTrue(all(spec['requires_manual_ingestion'] for spec in specs))
        self.assertEqual(specs[0]['source_id'], 'otrf-security-datasets')

    def test_should_write_replay_plan_to_json_file(self):
        registry = DatasetRegistry(ROOT / 'datasets' / 'dataset_manifest.json')
        plan = registry.build_replay_plan()
        with tempfile.TemporaryDirectory() as temp_dir:
            out_path = Path(temp_dir) / 'dataset_replay_plan.json'
            registry.write_replay_plan(out_path)
            loaded = json.loads(out_path.read_text(encoding='utf-8'))

        self.assertEqual(loaded['summary']['total_sources'], plan['summary']['total_sources'])
        self.assertEqual(loaded['execution_mode'], 'metadata_only_no_download')

    def test_should_build_metadata_only_case_spec_plan_for_public_sources(self):
        registry = DatasetRegistry(ROOT / 'datasets' / 'dataset_manifest.json')
        plan = registry.build_case_spec_plan()

        self.assertEqual(plan['execution_mode'], 'metadata_only_no_download')
        self.assertEqual(plan['summary']['enabled_public_sources'], 4)
        self.assertGreaterEqual(plan['summary']['case_specs'], 4)
        self.assertTrue(all(spec['adapter_mode'] == 'metadata_stub' for spec in plan['case_specs']))
        self.assertTrue(all(spec['download_allowed'] is False for spec in plan['case_specs']))
        self.assertIn('otrf-security-datasets', {spec['source_id'] for spec in plan['case_specs']})

    def test_should_write_case_spec_plan_to_json_file(self):
        registry = DatasetRegistry(ROOT / 'datasets' / 'dataset_manifest.json')
        with tempfile.TemporaryDirectory() as temp_dir:
            out_path = Path(temp_dir) / 'dataset_case_spec_plan.json'
            registry.write_case_spec_plan(out_path)
            loaded = json.loads(out_path.read_text(encoding='utf-8'))

        self.assertEqual(loaded['execution_mode'], 'metadata_only_no_download')
        self.assertGreaterEqual(loaded['summary']['case_specs'], 4)


if __name__ == '__main__':
    unittest.main()
