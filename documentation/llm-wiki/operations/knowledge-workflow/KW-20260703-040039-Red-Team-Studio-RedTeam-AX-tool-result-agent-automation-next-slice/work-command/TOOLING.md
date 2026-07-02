---
type: work_command_record
task_id: KW-20260703-040039-Red-Team-Studio-RedTeam-AX-tool-result-agent-automation-next-slice
project: Red Team Studio
task: RedTeam AX tool result agent automation next slice
created: 2026-07-03T04:00:39+09:00
source_package: K:/wiki/work command
---

# TOOLING

## Tool Need

Inspect and edit a mixed Python/React/Korean documentation codebase with regression confidence.

## Candidates

| candidate | type | benefit | risk | decision |
|---|---|---|---|---|
| `rg` | search | Fast anchor discovery | Needs manual interpretation | selected |
| `apply_patch` | edit | Precise diffs | More verbose for many files | selected |
| `pytest` | test | API contract validation | Test fixtures are not real ops | selected |
| `node --check` | test | JS syntax validation | Does not render UI | selected |
| accepted gate manifest | sanity | Project-level gate aggregation | Can take longer | selected |

## Build vs Adopt

Adopted existing RedTeam AX router tests and sanity scripts. No new tooling required.

## Selected Tool

Existing local development and sanity toolchain.

## Verification

All selected verification tools completed with exit_code 0 after correcting two documentation/anchor issues.
