---
type: work_command_record
task_id: KW-20260701-131412-Red-Team-Studio-Implement-RedTeam-AX-v2-tool-result-import-normalize-and-evidence-candidate-APIs
project: Red Team Studio
task: Implement RedTeam AX v2 tool result import normalize and evidence candidate APIs
created: 2026-07-01T13:14:12+09:00
source_package: K:/wiki/work command
---

# DECISIONS

## Ledger

| id | decision | alternatives | reason | impact |
|---|---|---|---|---|

## Entries

## Slice 6 Decisions

1. Raw tool output is stored as ToolRunRecord and is not report-ready.
2. NormalizedResult carries limitations and prohibited report claims.
3. Evidence from normalized tool output starts as `candidate`.
4. ToolAction status tracks OutputImported, Normalized, EvidenceCreated to support walkthrough audit.

