---
type: decision_log
task_id: KW-20260703-143824-Red-Team-Studio-RedTeam-AX-next-six-tool-operating-workflow-continuation
project: Red-Team-Studio
task: RedTeam AX next six-tool operating workflow continuation
created: 2026-07-03T14:38:24+09:00
---

# Decision Log

## Decision 1 - Six-tool work order as guidance layer

- decision: Add `/api/redteam/v2/toolchains/six-tool-work-order` and a RedTeam2 button/table.
- rationale: The user needs automation and beginner-friendly workflow guidance, but the platform must not auto-run high-risk scanner actions without ROE/HITL/runtime gates.
- effect: OpenVAS/ZAP route to read-only service import, SCA to artifact import, runner-ready tools to execute-governed, and readiness gaps to install/wrapper pin actions.
- limit: This does not mark the goal complete and does not replace real operating evidence or approval gates.

| time | decision | alternatives | reason | evidence |
|---|---|---|---|---|
|  |  |  |  |  |
