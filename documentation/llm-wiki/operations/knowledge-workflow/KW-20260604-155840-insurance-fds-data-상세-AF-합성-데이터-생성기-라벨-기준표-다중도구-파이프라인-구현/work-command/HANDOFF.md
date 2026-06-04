---
type: work_command_record
task_id: KW-20260604-155840-insurance-fds-data-상세-AF-합성-데이터-생성기-라벨-기준표-다중도구-파이프라인-구현
project: insurance-fds-data
task: 상세 AF 합성 데이터 생성기 라벨 기준표 다중도구 파이프라인 구현
created: 2026-06-04T15:58:40+09:00
source_package: K:/wiki/work command
---

# HANDOFF

## Original Request

## Current Interpretation

## Current State

## Decision Record

## Execution Record

## Tools And Capability

## Next Actions


## Handoff
- Start with `scripts/insurance_fds_synthetic_generator.py`.
- Run `pytest tests/test_insurance_fds_synthetic_generator.py -q`.
- Inspect `data/insurance-fds-generated/demo-v1/manifests/generated_manifest.json`.
- Next implementation should add renderer/OCR adapters without weakening PII controls.

verified_at: 2026-06-04T16:13:10+09:00
