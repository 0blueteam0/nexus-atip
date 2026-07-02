---
type: work_command_record
task_id: KW-20260702-235549-Red-Team-Studio-RedTeam-AX-collection-Matrix-and-report-draft-bridge-continuation-slice
project: Red Team Studio
task: RedTeam AX collection Matrix and report draft bridge continuation slice
created: 2026-07-02T23:55:49+09:00
source_package: K:/wiki/work command
---

# DECISIONS

## Ledger

| id | decision | alternatives | reason | impact |
|---|---|---|---|---|
| D-001 | Matrix draft accepts only approved collection Findings with approved Evidence. | Generate report directly from collection output. | Prevent unsupported claim and evidence-less finding propagation. | Held rows are visible but excluded from report validation payload. |
| D-002 | Report draft generation requires Matrix ready, no held rows, and report validation preview pass. | Let report generator decide later. | Keeps Claim-Evidence Matrix as the auditable gate before Korean Report v2 draft. | Final export remains a later HITL approval. |
| D-003 | UI exposes Matrix and Report v2 draft as separate RedTeam2 controls. | Hide bridge behind one combined action. | Operators need to see gate state and review blockers before report drafting. | Better auditability and recoverability. |

## Entries

The slice intentionally does not add final export approval. That is tracked as the remaining completion-audit gap.
