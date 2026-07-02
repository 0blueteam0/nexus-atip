---
type: tool_decision
status: updated
project: Red Team Studio
task: RedTeam AX strict live readiness promotion and remediation slice
created: 2026-07-02T17:20:57+09:00
---

# Tool Decision

## Selected Chain

Python promotion orchestrator plus existing readiness scripts, runtime readiness API, RedTeam2 panel, and accepted gate manifest.

## Reason

The final objective needs a single strict promotion proof, but current blockers should not be hidden behind separate artifacts. The orchestrator records all blockers while allowing future controlled validation to fail fast with `--require-promotion`.

## Rejected Alternatives

- Marking accepted gates as final completion: rejected because they preserve blocker state.
- Running network imports by default: rejected because ROE/HITL context is required.
- Running real container smoke by default: rejected because Docker daemon and pinned image readiness are not proven.

## Reuse Rule

Use default mode for blocker rollup. Use `--allow-container --allow-network --require-promotion` only for controlled release validation.
