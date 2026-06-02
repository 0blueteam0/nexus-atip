import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))

from replay_runner import ReplayRunner, load_evidence_packages, write_metrics_report


class ReplayRunnerTest(unittest.TestCase):
    def test_should_load_evidence_packages_from_fixture_directory(self):
        packages = load_evidence_packages(ROOT / 'fixtures')

        self.assertGreaterEqual(len(packages), 4)
        self.assertTrue(all(package['schema_version'] == '1.0' for package in packages))

    def test_should_compute_core_metrics_when_running_fixture_replay(self):
        runner = ReplayRunner(ROOT / 'fixtures')
        report = runner.run()

        self.assertEqual(report['schema_version'], '1.0')
        self.assertGreaterEqual(report['summary']['total_cases'], 4)
        self.assertEqual(report['summary']['tenant_leakage_count'], 0)
        self.assertEqual(report['summary']['unsupported_conclusion_count'], 0)
        self.assertGreaterEqual(report['metrics']['evidence_package_success_rate'], 1.0)
        self.assertGreaterEqual(report['metrics']['missing_reason_coverage'], 1.0)
        self.assertGreaterEqual(report['metrics']['prompt_injection_quarantine_rate'], 1.0)
        self.assertIn('go_decision', report)

    def test_should_write_metrics_report_to_json_file(self):
        runner = ReplayRunner(ROOT / 'fixtures')
        report = runner.run()
        with tempfile.TemporaryDirectory() as temp_dir:
            out_path = Path(temp_dir) / 'metrics.json'
            write_metrics_report(report, out_path)
            loaded = json.loads(out_path.read_text(encoding='utf-8'))

        self.assertEqual(loaded['summary']['total_cases'], report['summary']['total_cases'])
        self.assertEqual(loaded['go_decision']['decision'], report['go_decision']['decision'])

    def test_should_include_dataset_manifest_replay_plan_when_manifest_is_provided(self):
        runner = ReplayRunner(ROOT / 'fixtures', dataset_manifest=ROOT / 'datasets' / 'dataset_manifest.json')
        report = runner.run()

        self.assertIn('dataset_plan', report)
        self.assertEqual(report['dataset_plan']['execution_mode'], 'metadata_only_no_download')
        self.assertGreaterEqual(report['dataset_plan']['summary']['public_sources'], 4)
        self.assertEqual(report['dataset_plan']['summary']['dataset_readiness']['metadata_stub'], 4)

    def test_should_keep_go_decision_when_dataset_plan_is_metadata_only(self):
        runner = ReplayRunner(ROOT / 'fixtures', dataset_manifest=ROOT / 'datasets' / 'dataset_manifest.json')
        report = runner.run()

        self.assertEqual(report['go_decision']['decision'], 'go_for_next_seed')
        self.assertTrue(all(source['download_allowed'] is False for source in report['dataset_plan']['sources']))


if __name__ == '__main__':
    unittest.main()
