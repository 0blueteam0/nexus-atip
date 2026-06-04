"""OTRF adapter contract builder for metadata-only public dataset planning.

This module intentionally does not download, crawl, or parse OTRF raw datasets.
It converts the reviewed dataset manifest metadata into a concrete adapter
contract that can be reviewed before any raw ingestion work is approved.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from dataset_registry import DatasetRegistry

ROOT = Path(__file__).resolve().parents[1]


def utc_now() -> str:
    """Return an ISO-8601 UTC timestamp for generated reports."""
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace('+00:00', 'Z')


class OtrfContractBuilder:
    """Build a contract-only OTRF adapter plan from manifest metadata."""

    def __init__(self, source: dict[str, Any]) -> None:
        if source['source_id'] != 'otrf-security-datasets':
            raise ValueError('OtrfContractBuilder requires the otrf-security-datasets source')
        if source['source_type'] != 'public':
            raise ValueError('OtrfContractBuilder requires a public dataset source')
        self.source = source

    def build_contract(self) -> dict[str, Any]:
        """Build a metadata-only adapter contract for OTRF Security Datasets."""
        metadata_spec = self.source['metadata_spec']
        raw_profile = metadata_spec['raw_data_profile']
        normalization = metadata_spec['normalization_contract']
        access_review = metadata_spec['access_review']
        return {
            'schema_version': '1.0',
            'contract_id': 'otrf_adapter_contract_v1',
            'generated_at': utc_now(),
            'source_id': self.source['source_id'],
            'display_name': self.source['display_name'],
            'execution_mode': 'contract_only_no_download',
            'download_allowed': self.source['download_allowed'],
            'approval_gates': access_review,
            'source_url': metadata_spec['source_url'],
            'reference_urls': metadata_spec['reference_urls'],
            'target_schemas': normalization['target_schemas'],
            'field_mapping_contract': {
                'candidate_time_fields': raw_profile['expected_time_fields'],
                'candidate_entity_fields': raw_profile['expected_entity_fields'],
                'required_mappings': normalization['required_mappings'],
                'citation_requirement': 'every normalized evidence item must preserve source_ref or citation_id',
            },
            'case_contracts': [self._case_template_to_contract(template) for template in self.source['case_templates']],
            'unsupported_fields_policy': 'record_as_missing_evidence_or_adapter_limitation',
            'evaluation_metrics': metadata_spec['evaluation_use']['primary_metrics'],
            'excluded_uses': metadata_spec['evaluation_use']['excluded_uses'],
            'safety_invariants': [
                'no_raw_dataset_access',
                'no_download_without_explicit_approval',
                'no_license_bypass',
                'no_pii_or_sensitive_data_commit',
                'no_autonomous_response',
                'human_review_before_operational_use',
            ],
            'next_implementation_step': 'write parser interface tests against tiny local fixtures before approved dataset access',
        }

    def write_contract(self, out_path: Path) -> None:
        """Write the OTRF adapter contract as UTF-8 JSON."""
        out_path.parent.mkdir(parents=True, exist_ok=True)
        with out_path.open('w', encoding='utf-8') as fp:
            json.dump(self.build_contract(), fp, ensure_ascii=False, indent=2)
            fp.write('\n')

    def _case_template_to_contract(self, template: dict[str, Any]) -> dict[str, Any]:
        return {
            'template_id': template['template_id'],
            'scenario': template['scenario'],
            'expected_evidence': template['expected_evidence'],
            'expected_guardrails': template['expected_guardrails'],
            'candidate_tasks': self.source['candidate_tasks'],
            'mapping_status': 'not_implemented_contract_only',
        }


def main() -> int:
    """Write the OTRF adapter contract report and print it as JSON."""
    registry = DatasetRegistry(ROOT / 'datasets' / 'dataset_manifest.json')
    source = registry.get_source('otrf-security-datasets')
    out_path = ROOT / 'reports' / 'otrf_adapter_contract_v1.json'
    builder = OtrfContractBuilder(source)
    builder.write_contract(out_path)
    print(json.dumps({'out_path': str(out_path), 'contract': builder.build_contract()}, ensure_ascii=False, indent=2))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
