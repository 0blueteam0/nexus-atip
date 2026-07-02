---
type: work_command_record
task_id: KW-20260703-031415-Red-Team-Studio-RedTeam-AX-real-operating-evidence-submission-manifest-slice
project: Red Team Studio
task: RedTeam AX real operating evidence submission manifest slice
created: 2026-07-03T03:14:15+09:00
source_package: K:/wiki/work command
---

# TOOLING

## Tools Used

- `rg` and `Get-Content` for repository inspection.
- `apply_patch` for manual edits.
- Project venv Python for pytest.
- System Python for py_compile and sanity scripts.
- Node.js for frontend syntax check.

## Tooling Notes

System Python lacked pytest, so router tests used `J:/PortableApps/genai/projects/ai-agentic-soc/.venv/Scripts/python.exe`.

## Tooling Result

All selected verification tools exited with code 0 after path and anchor fixes.
