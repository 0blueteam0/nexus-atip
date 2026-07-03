---
type: decision_log
task_id: KW-20260703-161332-Red-Team-Studio-RedTeam-AX-reduce-analyst-UI-environment-path-English-exposure-in-RedTeam2
project: Red Team Studio
task: RedTeam AX reduce analyst UI environment path English exposure in RedTeam2
created: 2026-07-03T16:13:32+09:00
---

# Decision Log

| time | decision | alternatives | reason | evidence |
|---|---|---|---|---|
| 2026-07-03T16:30+09:00 | Hide raw storage/API locations in analyst-facing RedTeam2 copy | Remove backend keys entirely; leave all raw paths visible | Backend traceability must remain while beginner analyst UX should show Korean status summaries | `reports.js`, frontend sanity |
| 2026-07-03T16:35+09:00 | Update sanity contracts to reject representative raw exposure strings | Keep old anchors | The previous Korean inventory required strings that the new UX intentionally removed | `redteam_ax_frontend_launch_readiness_contract.py`, `test_redteam2_korean_copy_inventory.py` |
