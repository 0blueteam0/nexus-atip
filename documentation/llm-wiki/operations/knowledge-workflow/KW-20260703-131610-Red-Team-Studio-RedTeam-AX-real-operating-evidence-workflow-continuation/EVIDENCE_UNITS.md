---
type: evidence_units
project: Red Team Studio
task: RedTeam AX real operating evidence workflow continuation
created: 2026-07-03T13:16:10+09:00
---

# Evidence Units

| id | claim | evidence_type | source_path | artifact_path | command | exit_code | verified_at |
|---|---|---|---|---|---|---:|---|
| EV-001 | Real operating evidence readiness returns missing tool remediation rows. | code | `projects/ai-agentic-soc/runtime/redteam_v2_models.py` | `missing_tool_remediation`, `missing_tool_remediation_count` | `pytest ...test_v2_real_operating_evidence_readiness_blocks_fixture_source` | 0 | 2026-07-03T13:20:00+09:00 |
| EV-002 | OpenVAS and ZAP missing file patterns are tested. | test | `projects/ai-agentic-soc/tests/test_redteam_v2_api_router.py` | assertions for `*openvas*.xml` and `*zap*.json` | `pytest ...requires_six_tool_coverage` | 0 | 2026-07-03T13:20:00+09:00 |
| EV-003 | RedTeam2 renders missing tool remediation information. | frontend | `projects/ai-agentic-soc/soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js` | `realOperatingMissingToolRows` table | `node --check ...reports.js` | 0 | 2026-07-03T13:20:00+09:00 |
| EV-004 | Documentation and LLM wiki record the rule as guidance, not execution. | documentation | `projects/ai-agentic-soc/Red Team Studio/FINAL_PLAN.md`; `Detailed_PLAN.MD`; `고도화/llm-wiki/LLM_WIKI_HOME.md` | plan/wiki updates | `rg missing_tool_remediation ...` | 0 | 2026-07-03T13:20:00+09:00 |
| EV-005 | Completion audit includes the new proved remediation item while final goal remains blocked. | audit | `projects/ai-agentic-soc/Red Team Studio/고도화/completion-audit/redteam_ax_completion_audit_matrix.json` | `RTA-COMP-058`; status counts | `test_completion_audit_matrix.py`; `goal-completion-review` | 0 | 2026-07-03T13:24:00+09:00 |
