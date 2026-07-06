---
type: work_command_record
task_id: KW-20260706-134410-Red-Team-Studio-Continue-RedTeam-AX-goal-by-further-simplifying-RedTeam2-analysis-UI-and-alignin
project: Red-Team-Studio
task: Continue RedTeam AX goal by further simplifying RedTeam2 analysis UI and aligning tool execution workflow
created: 2026-07-06T13:44:10+09:00
source_package: K:/wiki/work command
---

# TOOLING

## Tool Need

## Candidates

| candidate | type | benefit | risk | decision |
|---|---|---|---|---|

## Build vs Adopt

## Selected Tool

## Verification

# Tooling

- Search/read: `rg`, `Get-Content -Encoding UTF8`, `node scripts/read-utf8.js`.
- Edits: `apply_patch`.
- Runtime verification: Vite dev server on `http://127.0.0.1:5177`.
- Browser verification: Playwright Chromium headless.
- Tests: `node --check`, `test_redteam2_korean_copy_inventory.py`, `redteam_ax_frontend_runtime_readiness_contract.py`, `redteam_ax_frontend_launch_readiness_contract.py`, `test_completion_audit_matrix.py`.
