---
type: work_command_record
task_id: KW-20260703-012119-Red-Team-Studio-RedTeam-AX-scanner-artifact-evidence-promotion-and-report-closure-slice
project: Red Team Studio
task: RedTeam AX scanner artifact evidence promotion and report closure slice
created: 2026-07-03T01:21:19+09:00
source_package: K:/wiki/work command
---

# TOOLING

## Tool Need

Need local code editing, regression testing, frontend syntax checking, and RedTeam AX sanity gates.

## Candidates

| candidate | type | benefit | risk | decision |
|---|---|---|---|---|
| apply_patch | edit | precise tracked edits | patch context can fail | used |
| pytest | test | validates API contracts | slower than focused tests | used |
| node --check | test | validates frontend syntax | no runtime render | used |
| accepted gate manifest | sanity | validates broad RedTeam AX gates | takes longer | used |

## Build vs Adopt

Adopted existing v2 model functions and API contracts. Built only a small orchestrator helper and UI wrapper.

## Selected Tool

## Verification
