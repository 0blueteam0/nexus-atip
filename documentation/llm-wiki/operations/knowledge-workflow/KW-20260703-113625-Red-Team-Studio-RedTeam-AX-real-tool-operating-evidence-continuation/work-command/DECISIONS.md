---
type: work_command_record
task_id: KW-20260703-113625-Red-Team-Studio-RedTeam-AX-real-tool-operating-evidence-continuation
project: Red Team Studio
task: RedTeam AX real tool operating evidence continuation
created: 2026-07-03T11:36:25+09:00
source_package: K:/wiki/work command
---

# DECISIONS

## Ledger

| id | decision | alternatives | reason | impact |
|---|---|---|---|---|
| D1 | Use project `.venv` for harness execution | System Python | System Python lacked FastAPI | Harnesses and tests use correct dependencies |
| D2 | Add Docker `--entrypoint=` to governed container launch | Keep image ENTRYPOINT | Image ENTRYPOINT duplicated approved command | Only approved runner argv executes |
| D3 | Keep RTA-COMP-015 partial | Mark runtime requirement proved | WSL and external scanner gates still fail | Goal remains active_incomplete |
| D4 | Regenerate byproduct review | Leave stale classification | New RTA-COMP-053 evidence refs were added | Completion evidence exclusion stays current |

## Entries

D1-D4 are reflected in `DECISION_LOG.md`, `runtime/redteam_v2_models.py`, completion audit files, and KW evidence records.
