---
type: work_command_record
task_id: KW-20260701-154433-Red-Team-Studio-Implement-RedTeam-AX-v2-governed-analysis-tool-runner-and-agent-registry-slice
project: Red Team Studio
task: Implement RedTeam AX v2 governed analysis tool runner and agent registry slice
created: 2026-07-01T15:44:33+09:00
updated: 2026-07-01T16:05:00+09:00
source_package: K:/wiki/work command
---

# TOOLING

## Tool Need

Read specs, implement scoped code, verify backend/frontend, run live API/UI smoke, and preserve evidence.

## Candidates

| candidate | type | benefit | risk | decision |
|---|---|---|---|---|
| `rg` | search | Fast spec/code discovery | Large output if broad | used with scoped reads |
| `apply_patch` | edit | Controlled diffs | Verbose for docs | used |
| project `.venv` | test runtime | Has FastAPI | Must use discovery for tests | used |
| npm/Vite | frontend build | Validates UI bundle | Existing chunk warning | used |
| Playwright | browser smoke | Verifies rendered ToolHub | Requires running 5177/8765 | used |

## Build vs Adopt

No new tooling was built. Existing runtime/test/frontend toolchain was adopted.

## Selected Tool

Project `.venv`, npm project scripts, and Playwright.

## Verification

All selected verification commands exited 0.
