---
type: work_command_record
task_id: KW-20260702-174256-Red-Team-Studio-RedTeam-AX-next-completion-blocker-reduction-slice
project: Red Team Studio
task: RedTeam AX next completion blocker reduction slice
created: 2026-07-02T17:42:56+09:00
source_package: K:/wiki/work command
---

# AGENT_ROSTER

## Roles Considered

| role | responsibility | used | reason |
|---|---|---|---|
| Codex implementation agent | edit UI, tests, docs, run gates | yes | current task scope |
| Platform operator | start Docker/WSL, configure services | no | external human-controlled work |
| Red team lead | approve endpoint/vault and strict promotion | no | not available in this slice |
| QA reviewer | verify regression | partial | accepted gate manifest used |

## Handoff Rules

Future agents must treat the UI runbook step table as guidance only. It is not evidence that the live readiness blockers are resolved.
