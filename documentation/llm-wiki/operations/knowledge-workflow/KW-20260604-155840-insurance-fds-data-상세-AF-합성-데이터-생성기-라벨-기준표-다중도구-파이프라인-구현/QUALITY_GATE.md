---
type: quality_gate
task_id: KW-20260604-155840-insurance-fds-data-상세-AF-합성-데이터-생성기-라벨-기준표-다중도구-파이프라인-구현
project: insurance-fds-data
task: 상세 AF 합성 데이터 생성기 라벨 기준표 다중도구 파이프라인 구현
created: 2026-06-04T15:58:40+09:00
---

# Quality Gate

| gate | result | evidence |
|---|---|---|
| Worklog updated | pending |  |
| Tool decision recorded | pending |  |
| Evidence units recorded | pending |  |
| Decisions captured | pending |  |
| Insights captured | pending |  |
| Ontology edges considered | pending |  |
| Handoff updated | pending |  |
| Official docs separated from work meta | pending |  |
| Encoding/log verification passed | pending |  |
| qmd update considered | pending |  |

## Quality gate update
- JSON parse: passed for generated demo JSON files.
- Tests: `pytest tests/test_insurance_fds_synthetic_generator.py -q` passed.
- PII guard: generated docs use `synthetic_no_real_pii`; 실제 PII/실제 병원 원문은 생성하지 않음.
