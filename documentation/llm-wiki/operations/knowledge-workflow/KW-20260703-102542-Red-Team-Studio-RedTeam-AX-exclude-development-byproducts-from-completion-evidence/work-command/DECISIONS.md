---
type: work_command_record
task_id: KW-20260703-102542-Red-Team-Studio-RedTeam-AX-exclude-development-byproducts-from-completion-evidence
project: Red Team Studio
task: RedTeam AX exclude development byproducts from completion evidence
created: 2026-07-03T10:25:42+09:00
source_package: K:/wiki/work command
---

# DECISIONS

## Ledger

| id | decision | alternatives | reason | impact |
|---|---|---|---|---|

## Entries

## Decisions

- Do not delete historical smoke or test artifacts; classify and exclude them from completion/report-claim use.
- Byproduct markers include archive/runs, tests, sanity, fixture, sample, smoke, CASE-V2, and operator-scanner-outputs.
- `completion_evidence_allowed=false` and `report_claim_evidence_allowed=false` are the two hard assertions for byproduct rows.
- RTA-COMP-050 can be proved once the review artifact and sanity test exist; the overall goal remains active incomplete.
