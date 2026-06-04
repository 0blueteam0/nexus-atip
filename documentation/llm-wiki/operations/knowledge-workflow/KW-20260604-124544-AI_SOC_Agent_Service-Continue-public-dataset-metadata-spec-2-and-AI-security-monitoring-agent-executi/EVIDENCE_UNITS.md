# Evidence Units

- id: EU-001
  command: python -m unittest discover -s implementation_seed/tests -v
  exit_code: 0
  artifact_path: J:/PortableApps/genai/A3Work/AI_SOC_Agent_Service/implementation_seed/tests
  verified_at: 2026-06-04T12:46+09:00
  observation: baseline 21 tests OK before changes.

- id: EU-002
  command: python -m unittest implementation_seed.tests.test_dataset_metadata_spec_v2 implementation_seed.tests.test_execution_plan2_generator -v
  exit_code: 1
  artifact_path: implementation_seed/tests/test_dataset_metadata_spec_v2.py, implementation_seed/tests/test_execution_plan2_generator.py
  verified_at: 2026-06-04T12:49+09:00
  observation: RED failures for missing metadata spec v2 fields/methods/module.

- id: EU-003
  command: python -m unittest discover -s implementation_seed/tests -v
  exit_code: 0
  artifact_path: implementation_seed/tests
  verified_at: 2026-06-04T12:54+09:00
  observation: 28 tests OK after implementation.

- id: EU-004
  command: python -m py_compile implementation_seed/scripts/*.py implementation_seed/tests/*.py
  exit_code: 0
  artifact_path: implementation_seed/scripts, implementation_seed/tests
  verified_at: 2026-06-04T12:54+09:00
  observation: syntax checks passed.

- id: EU-005
  command: python implementation_seed/scripts/dataset_registry.py > implementation_seed/reports/dataset_registry_v2.stdout.json
  exit_code: 0
  artifact_path: implementation_seed/reports/dataset_source_metadata_spec_v2.json
  verified_at: 2026-06-04T12:52+09:00
  observation: metadata spec v2 report generated with public_sources=5 and download_requires_approval=5.

- id: EU-006
  command: python implementation_seed/scripts/execution_plan2_generator.py > implementation_seed/reports/execution_plan2_generator.stdout.json
  exit_code: 0
  artifact_path: AI_SOC_Agent_Service_24_AI보안관제_에이전트_실행계획_2.md, docx/24_AI보안관제_에이전트_실행계획_2.docx
  verified_at: 2026-06-04T12:52+09:00
  observation: execution plan #2 artifacts generated.

- id: EU-007
  command: Python zipfile docx structural check
  exit_code: 0
  artifact_path: docx/24_AI보안관제_에이전트_실행계획_2.docx
  verified_at: 2026-06-04T12:53+09:00
  observation: word/document.xml and word/styles.xml present; text_nodes=104.
