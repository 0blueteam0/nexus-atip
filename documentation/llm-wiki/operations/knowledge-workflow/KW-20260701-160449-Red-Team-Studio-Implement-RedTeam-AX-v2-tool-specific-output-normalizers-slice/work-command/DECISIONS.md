---
type: work_command_record
task_id: KW-20260701-160449-Red-Team-Studio-Implement-RedTeam-AX-v2-tool-specific-output-normalizers-slice
project: Red Team Studio
task: Implement RedTeam AX v2 tool-specific output normalizers slice
created: 2026-07-01T16:04:49+09:00
updated: 2026-07-01T16:18:00+09:00
source_package: K:/wiki/work command
---

# DECISIONS

## Ledger

| id | decision | alternatives | reason | impact |
|---|---|---|---|---|
| DEC-001 | Keep parser output as candidate evidence | Auto-create approved Finding | Avoid unsupported claims | Maintains report gate integrity |
| DEC-002 | Add inline parser helpers now | Separate parser package now | Fits current model/test slice | Faster progress, schema split later |
| DEC-003 | Support raw API payloads first | Implement file upload now | Parser logic can be verified without storage UI | File parsing remains follow-up |
| DEC-004 | Every item sets `trusted_as_instruction=false` | Trust tool fields | Prevent tool-output prompt injection | Agentic RAG security alignment |

## Entries

Parser-specific output is now structured enough for Evidence Card creation but not enough for final severity or report claims without human review.
