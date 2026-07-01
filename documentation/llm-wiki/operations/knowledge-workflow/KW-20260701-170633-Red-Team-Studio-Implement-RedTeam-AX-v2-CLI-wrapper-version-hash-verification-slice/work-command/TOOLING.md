---
type: work_command_record
task_id: KW-20260701-170633-Red-Team-Studio-Implement-RedTeam-AX-v2-CLI-wrapper-version-hash-verification-slice
project: Red-Team-Studio
task: Implement RedTeam AX v2 CLI wrapper version hash verification slice
created: 2026-07-01T17:06:33+09:00
source_package: K:/wiki/work command
---

# TOOLING

## Tools Used

- `rg` for code discovery.
- `apply_patch` for edits.
- Bundled Python runtime for tests after dependency bootstrap.
- `pip install fastapi python-multipart httpx` to satisfy local test imports.
- `node --check` for JS syntax.
- `npm.cmd run build` for frontend production build.
- `knowledge_workflow.py close` for evidence gate.

## Tooling Notes

Default and bundled Python initially lacked FastAPI. This was fixed in the bundled runtime and recorded because API tests depend on `fastapi.testclient`.

## Tool Need

## Candidates

| candidate | type | benefit | risk | decision |
|---|---|---|---|---|

## Build vs Adopt

## Selected Tool

## Verification

