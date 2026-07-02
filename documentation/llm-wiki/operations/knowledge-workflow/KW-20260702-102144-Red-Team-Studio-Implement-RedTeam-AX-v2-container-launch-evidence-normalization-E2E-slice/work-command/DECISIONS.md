---
type: work_command_record
task_id: KW-20260702-102144-Red-Team-Studio-Implement-RedTeam-AX-v2-container-launch-evidence-normalization-E2E-slice
project: Red-Team-Studio
task: Implement RedTeam AX v2 container launch evidence normalization E2E slice
created: 2026-07-02T10:21:44+09:00
source_package: K:/wiki/work command
---

# DECISIONS

## Ledger

| id | decision | alternatives | reason | impact |
|---|---|---|---|---|

## Entries

# Decisions

- Do not classify container launch metadata as vulnerability evidence.
- Keep `requires_human_validation=true`.
- Keep `trusted_as_instruction=false`.
- Use existing Evidence Card candidate path instead of adding a parallel evidence type.
- Preserve scanner parser behavior for Nuclei/Trivy/npm audit/ZAP/OpenVAS/SCA.
