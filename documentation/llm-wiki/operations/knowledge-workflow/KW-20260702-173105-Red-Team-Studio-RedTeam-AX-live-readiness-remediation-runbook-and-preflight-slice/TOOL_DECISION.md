---
type: tool_decision
status: updated
project: Red Team Studio
task: RedTeam AX live readiness remediation runbook and preflight slice
created: 2026-07-02T17:31:05+09:00
---

# Tool Decision

Use a local Python runbook generator that reads the strict promotion artifact. This is safer and more auditable than embedding free-form instructions only in the UI, because the output is versioned as JSON and Markdown evidence.
