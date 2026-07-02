---
type: work_command_record
task_id: KW-20260702-102708-Red-Team-Studio-Implement-RedTeam-AX-v2-container-stdout-scanner-result-normalizer-E2E-slice
project: Red-Team-Studio
task: Implement RedTeam AX v2 container stdout scanner result normalizer E2E slice
created: 2026-07-02T10:27:08+09:00
source_package: K:/wiki/work command
---

# DECISIONS

## Ledger

| id | decision | alternatives | reason | impact |
|---|---|---|---|---|

## Entries

# Decisions

- Keep real container execution out of automated regression.
- Use synthetic Trivy JSON to prove parser flow.
- Preserve launch-control evidence alongside scanner finding candidates.
- Do not auto-promote scanner candidates to findings.
- Keep Evidence Card candidate status pending review.
