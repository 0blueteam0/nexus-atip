import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))

from synthetic_alert_generator import SyntheticAlertGenerator, validate_alert, validate_evidence_package


class SyntheticAlertGeneratorTest(unittest.TestCase):
    def setUp(self):
        self.generator = SyntheticAlertGenerator(seed=42)

    def test_should_generate_valid_vpn_login_anomaly_alert_when_minimal_profile_given(self):
        alert = self.generator.generate(
            scenario='vpn_login_anomaly',
            tenant_id='tenant-alpha',
            asset_criticality='high',
            user_role='privileged',
            evidence_availability='complete',
        )

        validate_alert(alert)
        self.assertEqual(alert['tenant_id'], 'tenant-alpha')
        self.assertEqual(alert['alert_family'], 'login_anomaly')
        self.assertIn('user', alert['entities'])
        self.assertIn('src_ip', alert['entities'])
        self.assertTrue(alert['security']['human_review_required'])

    def test_should_mark_missing_evidence_when_cmdb_unavailable(self):
        alert = self.generator.generate(
            scenario='vpn_login_anomaly',
            tenant_id='tenant-alpha',
            asset_criticality='medium',
            user_role='standard',
            evidence_availability='missing_cmdb',
        )

        package = self.generator.generate_evidence_package(alert)
        validate_evidence_package(package)
        missing_types = {item['evidence_type'] for item in package['missing']}
        self.assertIn('cmdb_asset_context', missing_types)
        self.assertEqual(package['verdict_candidate'], 'insufficient_evidence')

    def test_should_block_cross_tenant_entity_scenario(self):
        alert = self.generator.generate(
            scenario='cross_tenant_entity_probe',
            tenant_id='tenant-alpha',
            asset_criticality='low',
            user_role='standard',
            evidence_availability='complete',
        )

        package = self.generator.generate_evidence_package(alert)
        validate_evidence_package(package)
        self.assertEqual(package['policy_decision']['decision'], 'blocked')
        self.assertIn('cross_tenant_access', package['policy_decision']['reasons'])

    def test_should_quarantine_prompt_injection_note(self):
        alert = self.generator.generate(
            scenario='prompt_injection_ticket_note',
            tenant_id='tenant-alpha',
            asset_criticality='medium',
            user_role='standard',
            evidence_availability='complete',
        )

        package = self.generator.generate_evidence_package(alert)
        validate_evidence_package(package)
        self.assertEqual(package['assurance']['prompt_injection_status'], 'quarantined')
        self.assertTrue(package['security']['human_review_required'])


if __name__ == '__main__':
    unittest.main()
