---
type: work_command_record
task_id: KW-20260707-090951-Red-Team-Studio-Continue-RedTeam-AX-goal-by-localizing-shared-Report-Studio-and-RedTeam2-remaini
project: Red-Team-Studio
task: Continue RedTeam AX goal by localizing shared Report Studio and RedTeam2 remaining analyst-facing English labels
created: 2026-07-07T09:09:51+09:00
source_package: K:/wiki/work command
---

# DECISIONS

## Ledger

| id | decision | alternatives | reason | impact |
|---|---|---|---|---|
| D-001 | Use Korean-first common Report Studio labels. | Keep mixed English/Korean tabs. | Common header is part of default analyst first view. | Old header/tab English count becomes 0 in RedTeam2 DOM. |
| D-002 | Replace default `RBAC` labels with `권한 정책` terms. | Keep RBAC as a required UI technical term. | Beginner analyst view should prioritize job meaning over acronym. | Korean copy inventory no longer requires `RBAC` in default UI. |
| D-003 | Preserve backend/audit identifiers. | Rename API and payload keys. | Evidence and audit traceability must remain stable. | UI improves without breaking contracts. |

## Entries

- D-001 evidence: `reports.js`, Playwright DOM JSON.
- D-002 evidence: `reports.js`, `test_redteam2_korean_copy_inventory.py`, DOM JSON.
- D-003 evidence: runtime/launch readiness tests passed without API contract rewrite.
