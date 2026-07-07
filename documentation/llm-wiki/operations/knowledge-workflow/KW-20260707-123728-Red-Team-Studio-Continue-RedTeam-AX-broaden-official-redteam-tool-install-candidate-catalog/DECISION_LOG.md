---
type: decision_log
task_id: KW-20260707-123728-Red-Team-Studio-Continue-RedTeam-AX-broaden-official-redteam-tool-install-candidate-catalog
project: Red Team Studio
task: Continue RedTeam AX broaden official redteam tool install candidate catalog
created: 2026-07-07T12:37:28+09:00
---

# Decision Log

## D1 - Broaden Candidate Catalog, Do Not Execute

Decision: Add many SPEC 24 tools as install candidates while leaving `commands_executed_by_api=false` and `trusted_as_instruction=false`.

Rationale: The user wants broad search/install-related progress, but RedTeam AX requires ROE/HITL/guardrail approval before tool execution.

Impact: Frontend can show the broader install backlog; backend still refuses to imply executable status for these tools.

## D2 - Use Official Source Basis

Decision: Each new candidate references official project documentation or official repository/source pages.

Rationale: Installation instructions and project ownership change over time. Official sources are the right baseline for onboarding records.

Impact: Promotion to ToolProfile still requires fresh install verification and wrapper pinning.

| time | decision | alternatives | reason | evidence |
|---|---|---|---|---|
|  |  |  |  |  |
