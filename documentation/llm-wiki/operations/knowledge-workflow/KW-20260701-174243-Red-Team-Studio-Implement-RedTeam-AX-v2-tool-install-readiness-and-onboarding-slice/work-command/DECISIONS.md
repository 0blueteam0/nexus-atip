---
type: work_command_record
task_id: KW-20260701-174243-Red-Team-Studio-Implement-RedTeam-AX-v2-tool-install-readiness-and-onboarding-slice
project: Red-Team-Studio
task: Implement RedTeam AX v2 tool install readiness and onboarding slice
created: 2026-07-01T17:42:43+09:00
source_package: K:/wiki/work command
---

# DECISIONS

## Filled Record

D1: install readiness is plan-only. The API never executes package manager, Docker, version, or scanner commands in this slice.

D2: readiness is embedded into `analysis-tools` and also exposed as a dedicated endpoint. This supports both registry-wide UI and single-tool inspection.

D3: SCA is `import_only_ready` because it depends on uploaded SBOM, lockfile, or SCA export rather than a local wrapper command.

D4: readiness links to normalizer and analysis agent metadata so installed tools still flow into Evidence Cards and Claim-Evidence validation.

## Ledger

| id | decision | alternatives | reason | impact |
|---|---|---|---|---|

## Entries

