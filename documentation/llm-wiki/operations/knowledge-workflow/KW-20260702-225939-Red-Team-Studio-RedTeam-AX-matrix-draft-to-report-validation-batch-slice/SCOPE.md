---
type: scope
task_id: KW-20260702-225939-Red-Team-Studio-RedTeam-AX-matrix-draft-to-report-validation-batch-slice
project: Red Team Studio
task: RedTeam AX matrix draft to report validation batch slice
created: 2026-07-02T22:59:39+09:00
enforcement_level: L2-or-higher
---

# Scope

## User Intent

Continue the RedTeam AX objective by moving from approved Claim-Evidence Matrix draft rows toward Korean Red Team Report v2 draft generation without bypassing Evidence, Finding, HITL, or report gate controls.

## Included

- Backend report-draft API based on Matrix draft.
- Tests for held-row blocking and ready-row report generation.
- RedTeam2 Korean UI guidance and frontend contract anchors.
- FINAL_PLAN, Detailed_PLAN, LLM Wiki, and completion audit updates.
- Accepted gate manifest refresh.

## Excluded

- Real Docker/WSL/OpenVAS/ZAP environment repair.
- Final export approval.
- Claim insertion from held or unapproved candidates.
- Tool execution or active scan.

## Completion Definition

This slice is complete when the report-draft lane is implemented, tested, documented, and committed. The overall thread goal remains active incomplete until all real operating candidates and runtime gates are fully verified.
