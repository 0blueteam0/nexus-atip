---
type: work_command_record
task_id: KW-20260701-160449-Red-Team-Studio-Implement-RedTeam-AX-v2-tool-specific-output-normalizers-slice
project: Red Team Studio
task: Implement RedTeam AX v2 tool-specific output normalizers slice
created: 2026-07-01T16:04:49+09:00
updated: 2026-07-01T16:18:00+09:00
source_package: K:/wiki/work command
---

# AGENT_ROSTER

## Roles Considered

| role | responsibility | used | reason |
|---|---|---|---|
| Codex implementation agent | Code/tests/docs | yes | Current executor |
| ToolResultNormalizerAgent | Parser behavior | implemented in model helpers | Needed for six tools |
| CriticAgent | Unsupported claim prevention | represented by prohibited claims and candidate-only policy | No separate agent runtime yet |
| SandboxRunnerAgent | Real execution | no | Out of scope for parser slice |

## Handoff Rules

Future work must keep parser output as untrusted candidate evidence until analyst approval and Finding severity approval are complete.
