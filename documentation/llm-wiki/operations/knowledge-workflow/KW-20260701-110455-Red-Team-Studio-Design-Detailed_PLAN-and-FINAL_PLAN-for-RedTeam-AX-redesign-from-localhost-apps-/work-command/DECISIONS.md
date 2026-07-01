---
type: work_command_record
task_id: KW-20260701-110455-Red-Team-Studio-Design-Detailed_PLAN-and-FINAL_PLAN-for-RedTeam-AX-redesign-from-localhost-apps-
project: Red Team Studio
task: Design Detailed_PLAN and FINAL_PLAN for RedTeam AX redesign from localhost apps, chatshare, and full folder inventory
created: 2026-07-01T11:04:55+09:00
source_package: K:/wiki/work command
---

# DECISIONS

## Ledger

| id | decision | alternatives | reason | impact |
|---|---|---|---|---|

## Entries

| id | decision | alternatives | reason | impact |
|---|---|---|---|---|
| D1 | Add `레드팀 분석2` instead of replacing existing tab | replace `redteam` | keeps regression baseline | lower UI risk |
| D2 | Use isolated frontend state namespace | reuse `redteamAnalysisDraft` | avoid state collision | safer clone |
| D3 | Prefer `/api/redteam/v2` | `/api/redteam2`, mutate v1 | compatibility | parallel backend |
| D4 | Treat ChatShare as planning source material | use as direct finding evidence | avoid overclaiming | cleaner evidence boundary |
| D5 | Use LLM wiki manifest | inline full file contents | 4687 files/248MB | callable context without bloating |
| D6 | Use scoped `git add -f` | skip commit because ignored | user requested GitHub push | track only M0 artifacts |

