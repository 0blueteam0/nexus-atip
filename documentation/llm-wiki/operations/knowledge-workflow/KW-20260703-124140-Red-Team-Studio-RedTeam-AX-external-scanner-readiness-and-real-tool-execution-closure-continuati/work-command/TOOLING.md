---
type: work_command_record
task_id: KW-20260703-124140-Red-Team-Studio-RedTeam-AX-external-scanner-readiness-and-real-tool-execution-closure-continuati
project: Red Team Studio
task: RedTeam AX external scanner readiness and real tool execution closure continuation
created: 2026-07-03T12:41:40+09:00
source_package: K:/wiki/work command
---

# TOOLING

## Tool Need

Backend validation for endpoint/vault setup, plus regression and artifact evidence.

## Candidates

| candidate | type | benefit | risk | decision |
|---|---|---|---|---|
| API model edit | code | Enforces safety at source | Needs tests | selected |
| Standalone sanity only | script | Easy artifact | Does not protect API | rejected |
| Frontend-only guidance | UI | User-visible | Not enforceable | rejected |

## Build vs Adopt

Adopted existing API and sanity tools; built only missing diagnostics.

## Selected Tool

`redteam_v2_models.py`, targeted pytest, external scanner readiness/import smokes.

## Verification

2 targeted tests passed; smokes produced blocked artifacts without network/service fetch.
