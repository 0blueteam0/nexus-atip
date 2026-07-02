---
type: work_command_record
status: complete
project: Red Team Studio
created: 2026-07-03T03:49:01+09:00
updated: 2026-07-03T04:08:00+09:00
---

# DECISIONS

## Decision 1

Use the existing `/api/redteam/v2/toolchains/execute-governed` response as the progress source instead of adding a new polling API.

## Decision 2

Keep execution safety unchanged. The slice adds progress fields only and preserves ToolActionCard, ExecutionPlan, token, wrapper pin, and shell=false constraints.

## Decision 3

Expose Korean `operator_summary_ko`, `next_action_ko`, per-step `status_ko`, and `operator_message_ko` because the frontend is for Korean users with limited technical background.
