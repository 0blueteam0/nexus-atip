---
type: tool_decision
status: complete
project: Red Team Studio
created: 2026-07-03T00:36:03+09:00
---

# Tool Decision

## Decision

Use local shell, pytest, node syntax check, and RedTeam AX sanity scripts. Avoid external scanner execution and network scanner endpoints in this slice.

## Rationale

The missing capability was a governed data attachment path. Existing execution records, normalizers, Evidence approval, Matrix/report/export, and completion gate APIs can be reused without adding a new external dependency.

## Tools

- `apply_patch`
- PowerShell shell commands
- project venv `pytest`
- `node --check`
- RedTeam AX sanity scripts
