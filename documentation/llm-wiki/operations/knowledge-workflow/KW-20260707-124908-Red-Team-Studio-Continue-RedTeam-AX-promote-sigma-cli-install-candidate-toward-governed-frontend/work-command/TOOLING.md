---
type: work_command_record
task_id: KW-20260707-124908-Red-Team-Studio-Continue-RedTeam-AX-promote-sigma-cli-install-candidate-toward-governed-frontend
project: Red Team Studio
task: Continue RedTeam AX promote sigma-cli install candidate toward governed frontend execution
created: 2026-07-07T12:49:08+09:00
source_package: K:/wiki/work command
---

# TOOLING

## Installed Tool

- Tool: sigma-cli
- Version: 3.0.3
- Location: project `.venv\Scripts\sigma.exe`
- Verification: `sigma version` exit_code 0 and `sigma check <sample rule>` exit_code 0.

## Local Commands

- `python -m pip install sigma-cli`
- `sigma version`
- `sigma check redteam_ax_local_process_creation_check.yml`
- py_compile
- targeted pytest
- node syntax check
- frontend runtime/launch sanity

## Known Issue

`pip check` reports dependency conflicts involving `flare-floss`, `python-fx`, `networkx`, `pillow`, and `wcwidth`.

## Tool Need

## Candidates

| candidate | type | benefit | risk | decision |
|---|---|---|---|---|

## Build vs Adopt

## Selected Tool

## Verification
