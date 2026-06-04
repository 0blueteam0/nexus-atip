# Decision Log

- decision: Keep public datasets metadata-only in #2.
  reason: user asked to proceed, but prior plan explicitly blocks download/crawling until approval.
  command: schema requires download_allowed=false and tests assert approval flags
  exit_code: 0
  artifact_path: implementation_seed/schemas/dataset_manifest.schema.json
  verified_at: 2026-06-04T12:54+09:00

- decision: Add metadata_spec under each source instead of creating a separate disconnected file.
  reason: adapter/case spec generation needs source-local access and normalization metadata.
  command: python -m unittest implementation_seed.tests.test_dataset_metadata_spec_v2 -v
  exit_code: 0
  artifact_path: implementation_seed/datasets/dataset_manifest.json
  verified_at: 2026-06-04T12:52+09:00

- decision: Generate standalone execution plan #2 as doc24 instead of overwriting existing doc21/22.
  reason: prior workflow favored reversible addenda before canonical document merge.
  command: python implementation_seed/scripts/execution_plan2_generator.py
  exit_code: 0
  artifact_path: A3Work/AI_SOC_Agent_Service/docx/24_AI보안관제_에이전트_실행계획_2.docx
  verified_at: 2026-06-04T12:52+09:00
