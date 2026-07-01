---
type: work_command_record
task_id: KW-20260701-162340-Red-Team-Studio-Implement-RedTeam-AX-v2-tool-output-sanitizer-quarantine-redaction-preview-slice
project: Red-Team-Studio
task: Implement RedTeam AX v2 tool output sanitizer quarantine redaction preview slice
created: 2026-07-01T16:23:40+09:00
source_package: K:/wiki/work command
---

# AGENT_ROSTER

## Roles Considered

| role | responsibility | used | reason |
|---|---|---|---|

## Handoff Rules

# Agent Roster

- Codex: implementation, verification, evidence session, git handoff.
- ToolOutputSanitizer: deterministic backend guardrail for prompt injection/secret redaction.
- LLM analysis agents: receive sanitized output path and quarantine errors rather than raw instructions.
- Human analyst: reviews quarantine/redaction before evidence or report use.
