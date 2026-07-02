---
type: work_command_record
task_id: KW-20260703-041522-Red-Team-Studio-RedTeam-AX-real-operating-E2E-next-progress-slice
project: Red Team Studio
task: RedTeam AX real operating E2E next progress slice
created: 2026-07-03T04:15:22+09:00
source_package: K:/wiki/work command
---

# TOOLING

## Tool Need

Add and verify SBOM parsing inside the existing RedTeam AX toolchain.

## Candidates

| candidate | type | benefit | risk | decision |
|---|---|---|---|---|
| Existing SCA normalizer | code path | Directly affects collect-results | Schema variations require tests | selected |
| New parser module | code path | Isolation | More churn | rejected |
| Frontend-only copy | UI | Low risk | No evidence improvement | rejected |

## Build vs Adopt

Adopted existing normalizer and tests; built small helper functions for license, supplier, and affects parsing.

## Selected Tool

Existing backend normalizer plus project regression/sanity suite.

## Verification

Focused SCA test, full router test, compile, JS check, and accepted gate all passed.
