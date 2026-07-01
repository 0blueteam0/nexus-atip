---
type: work_command_record
task_id: KW-20260701-154433-Red-Team-Studio-Implement-RedTeam-AX-v2-governed-analysis-tool-runner-and-agent-registry-slice
project: Red Team Studio
task: Implement RedTeam AX v2 governed analysis tool runner and agent registry slice
created: 2026-07-01T15:44:33+09:00
updated: 2026-07-01T16:05:00+09:00
source_package: K:/wiki/work command
---

# AGENT_ROSTER

## Roles Considered

| role | responsibility | used | reason |
|---|---|---|---|
| Codex implementation agent | Code, tests, live smoke, evidence | yes | Current executor |
| ToolSafetyAgent | Risk/policy checks | implemented as model logic | Approval gate and prohibited options |
| ToolResultNormalizerAgent | Normalize tool output | implemented as registry/API foundation | Per-tool LLM agent registry |
| SandboxRunnerAgent | Real sandbox execution | no | Deferred until allowlist/runner slice |
| Security reviewer | Adversarial review | partial | Self-review in session |

## Handoff Rules

Future agents must not enable direct active scanner execution without ToolAction approval, scope validation, sandbox/network policy, audit, and Evidence conversion.
