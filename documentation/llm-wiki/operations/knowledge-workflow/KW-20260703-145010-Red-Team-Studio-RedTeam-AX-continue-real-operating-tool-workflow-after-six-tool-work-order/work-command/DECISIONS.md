---
type: work_command_record
task_id: KW-20260703-145010-Red-Team-Studio-RedTeam-AX-continue-real-operating-tool-workflow-after-six-tool-work-order
project: Red-Team-Studio
task: RedTeam AX continue real operating tool workflow after six-tool work order
created: 2026-07-03T14:50:10+09:00
source_package: K:/wiki/work command
---

# DECISIONS

## Ledger

| id | decision | alternatives | reason | impact |
|---|---|---|---|---|
| D-001 | Add separate analyst guide panel | Keep all readiness details in one panel | User requested simplified analyst flow | Reduces UI confusion |
| D-002 | Keep readiness details in admin panel | Remove readiness details | Operators still need setup state | Preserves operational traceability |
| D-003 | Add submission-template API only | Execute scanners from API | HITL/ROE requires human operation for high-risk tools | Avoids unauthorized execution |
| D-004 | Keep goal status incomplete | Mark goal complete | Real evidence is still missing | Prevents unsupported completion claim |

## Entries

D-001 and D-002 are paired: analyst UI gives only the next button sequence, while administrator UI retains Docker, WSL, OpenVAS/ZAP endpoint, external vault reference, and promotion gate. D-003 ensures the webapp helps with collection and submission rather than running dangerous commands. D-004 follows goal-completion-review output.
