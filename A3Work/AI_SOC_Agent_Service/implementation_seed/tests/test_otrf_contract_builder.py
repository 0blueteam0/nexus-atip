import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))

from dataset_registry import DatasetRegistry
from otrf_contract_builder import OtrfContractBuilder


class OtrfContractBuilderTest(unittest.TestCase):
    def test_should_build_otrf_adapter_contract_without_download(self):
        source = DatasetRegistry(ROOT / 'datasets' / 'dataset_manifest.json').get_source('otrf-security-datasets')
        contract = OtrfContractBuilder(source).build_contract()

        self.assertEqual(contract['schema_version'], '1.0')
        self.assertEqual(contract['source_id'], 'otrf-security-datasets')
        self.assertEqual(contract['execution_mode'], 'contract_only_no_download')
        self.assertFalse(contract['download_allowed'])
        self.assertTrue(contract['approval_gates']['download_requires_approval'])
        self.assertIn('normalized_alert', contract['target_schemas'])
        self.assertIn('evidence_package', contract['target_schemas'])
        self.assertIn('TimeCreated', contract['field_mapping_contract']['candidate_time_fields'])
        self.assertIn('process_guid', contract['field_mapping_contract']['candidate_entity_fields'])
        self.assertEqual(contract['unsupported_fields_policy'], 'record_as_missing_evidence_or_adapter_limitation')
        self.assertIn('no_raw_dataset_access', contract['safety_invariants'])

    def test_should_write_otrf_contract_report(self):
        source = DatasetRegistry(ROOT / 'datasets' / 'dataset_manifest.json').get_source('otrf-security-datasets')
        with tempfile.TemporaryDirectory() as temp_dir:
            out_path = Path(temp_dir) / 'otrf_adapter_contract_v1.json'
            OtrfContractBuilder(source).write_contract(out_path)
            loaded = json.loads(out_path.read_text(encoding='utf-8'))

        self.assertEqual(loaded['source_id'], 'otrf-security-datasets')
        self.assertEqual(loaded['execution_mode'], 'contract_only_no_download')
        self.assertGreaterEqual(len(loaded['case_contracts']), 1)


if __name__ == '__main__':
    unittest.main()
