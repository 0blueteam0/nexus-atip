---
type: work_command_record
task_id: KW-20260604-155840-insurance-fds-data-상세-AF-합성-데이터-생성기-라벨-기준표-다중도구-파이프라인-구현
project: insurance-fds-data
task: 상세 AF 합성 데이터 생성기 라벨 기준표 다중도구 파이프라인 구현
created: 2026-06-04T15:58:40+09:00
source_package: K:/wiki/work command
---

# DECISIONS

## Ledger

| id | decision | alternatives | reason | impact |
|---|---|---|---|---|

## Entries


## Decisions
- Keep v1 generator dependency-light and deterministic.
- Generate multiple artifact modalities from one structured source to avoid renderer overfitting.
- Treat ComfyUI/diffusion as optional background/texture variation only, not semantic document text creation.
- Keep MCP configuration documented for next stage rather than changing Hermes runtime config mid-task.

verified_at: 2026-06-04T16:13:10+09:00
