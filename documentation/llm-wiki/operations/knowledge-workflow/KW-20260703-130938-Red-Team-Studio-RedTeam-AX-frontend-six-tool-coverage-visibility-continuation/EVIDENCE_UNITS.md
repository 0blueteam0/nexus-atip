# Evidence Units

| id | type | command_or_source | exit_code | verified_at | claim_supported |
|---|---|---:|---:|---|---|
| EU-001 | code | `reports.js` | n/a | 2026-07-03T13:12:00+09:00 | RedTeam2 renders six-tool coverage |
| EU-002 | sanity | `node --check reports.js` | 0 | 2026-07-03T13:13:00+09:00 | Frontend syntax valid |
| EU-003 | sanity | `redteam_ax_frontend_runtime_readiness_contract.py` | 0 | 2026-07-03T13:13:00+09:00 | UI contract includes coverage labels |
| EU-004 | sanity | `test_redteam2_korean_copy_inventory.py` | 0 | 2026-07-03T13:13:00+09:00 | Korean copy inventory includes labels |
| EU-005 | regression | targeted pytest for collection coverage | 0 | 2026-07-03T13:13:00+09:00 | Backend coverage behavior preserved |
| EU-006 | gate | goal-completion-review | 0 | 2026-07-03T13:14:00+09:00 | Full goal remains blocked |
