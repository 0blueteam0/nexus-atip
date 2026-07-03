---
type: ontology_edges
status: draft
project: Red Team Studio
created: 2026-07-03T15:23:47+09:00
---

# Ontology Edges

| subject | predicate | object | evidence_id | note |
|---|---|---|---|---|
|  |  |  |  |  |

# Ontology Edges

- `runtime-readiness` -> `analyst_readiness_summary` -> `분석가용 다음 실행 안내`
- `runtime-readiness` -> `operator_environment_summary` -> `분석 환경 설정(관리자용)`
- `analyst_readiness_summary` -> `can_run_active_scan=false` -> `HITL/high-risk execution guardrail`
- `operator_environment_summary` -> `Docker/WSL/OpenVAS/ZAP endpoint/vault/strict promotion` -> `environment operator action`
- `role_separated_next_steps` -> `next_action_plan` -> `audit-preserved raw readiness plan`
