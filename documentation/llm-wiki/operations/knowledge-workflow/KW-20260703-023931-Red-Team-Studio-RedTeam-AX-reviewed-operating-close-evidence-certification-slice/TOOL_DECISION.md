---
type: tool_decision
status: recorded
project: Red-Team-Studio
task: RedTeam AX reviewed operating close evidence certification slice
created: 2026-07-03T02:39:31+09:00
---

# Tool Decision

| tool | reason | result |
|---|---|---|
| `apply_patch` | Scoped edits. | Used for code/test/docs. |
| `pytest` | Backend regression. | Focused and full suites passed. |
| `node --check` | Frontend syntax. | Passed. |
| sanity scripts | Korean/audit/plan/accepted gates. | Passed. |

## Decision

Certification must not mark the goal complete. It produces a completion-audit candidate only after close/report/completion gates and real-operator attestations are present.