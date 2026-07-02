---
type: work_command_record
task_id: KW-20260702-170524-Red-Team-Studio-RedTeam-AX-container-runtime-and-remaining-live-execution-evidence-slice
project: Red Team Studio
created: 2026-07-02T17:05:24+09:00
---

# TOOLING

## Added Tool

`Red Team Studio/고도화/sanity/redteam_ax_wsl_runtime_readiness.py`

## Tool Behavior

Default mode lists WSL distros only. `--allow-start` probes selected distro start and tool paths with no scanner execution. `--require-ready` makes readiness promotion fail when WSL is not ready.

## Integration Points

- `/api/redteam/v2/runtime-readiness`
- RedTeam2 runtime readiness panel
- `GATE-WSL-RUNTIME-READINESS`

## Safety

No active scan, no external network call, no command trusted as instruction.
