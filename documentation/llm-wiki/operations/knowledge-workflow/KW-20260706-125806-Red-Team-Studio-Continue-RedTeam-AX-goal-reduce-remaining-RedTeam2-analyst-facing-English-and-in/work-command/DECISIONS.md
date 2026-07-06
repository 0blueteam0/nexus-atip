---
type: work_command_record
task_id: KW-20260706-125806-Red-Team-Studio-Continue-RedTeam-AX-goal-reduce-remaining-RedTeam2-analyst-facing-English-and-in
project: Red-Team-Studio
task: Continue RedTeam AX goal: reduce remaining RedTeam2 analyst-facing English and internal tokens
created: 2026-07-06T12:58:06+09:00
source_package: K:/wiki/work command
---

# DECISIONS

## Display Boundary

- Use a frontend display translation layer for default analyst copy.
- Keep original backend identifiers and API contracts intact.
- Show raw implementation values only when the existing admin/debug detail mode is enabled.

## Completion Boundary

- Add one completion audit proof item for the RedTeam2 default DOM reduction.
- Do not mark the full RedTeam AX goal complete because broader gates remain.

## Testing Boundary

- Treat browser DOM evidence as required for this change because the issue is visible analyst UI copy.
- Pair browser evidence with syntax and Python contract checks.
