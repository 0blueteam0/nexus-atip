# Ontology Edges

edge: dataset_manifest.json -> contains -> metadata_spec_v2
command: python -m unittest implementation_seed.tests.test_dataset_metadata_spec_v2 -v
exit_code: 0
artifact_path: implementation_seed/datasets/dataset_manifest.json
verified_at: 2026-06-04T12:52+09:00

edge: metadata_spec_v2 -> constrains -> PublicDatasetAdapter case_specs
command: python -m unittest implementation_seed.tests.test_dataset_metadata_spec_v2.DatasetMetadataSpecV2Test.test_public_dataset_case_specs_should_carry_metadata_spec_contract -v
exit_code: 0
artifact_path: implementation_seed/scripts/public_dataset_adapter.py
verified_at: 2026-06-04T12:52+09:00

edge: dataset_source_metadata_spec_v2.json -> informs -> AI 보안관제 에이전트 실행계획 #2
command: python implementation_seed/scripts/execution_plan2_generator.py
exit_code: 0
artifact_path: AI_SOC_Agent_Service_24_AI보안관제_에이전트_실행계획_2.md
verified_at: 2026-06-04T12:52+09:00
