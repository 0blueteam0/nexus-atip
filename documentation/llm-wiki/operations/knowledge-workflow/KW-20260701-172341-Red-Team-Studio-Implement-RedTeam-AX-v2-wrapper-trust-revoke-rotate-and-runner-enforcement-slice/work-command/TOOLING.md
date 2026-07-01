---
type: work_command_record
task_id: KW-20260701-172341-Red-Team-Studio-Implement-RedTeam-AX-v2-wrapper-trust-revoke-rotate-and-runner-enforcement-slice
project: Red-Team-Studio
task: Implement RedTeam AX v2 wrapper trust revoke rotate and runner enforcement slice
created: 2026-07-01T17:23:42+09:00
source_package: K:/wiki/work command
---

# TOOLING

## Tool Need
Implement and validate a scoped RedTeam AX backend/frontend slice while preserving knowledge-workflow evidence and avoiding unrelated repository changes.

## Candidates

| candidate | type | benefit | risk | decision |
|---|---|---|---|---|
| `apply_patch` | edit tool | Precise source/doc edits with visible diffs. | Patch context can fail if files drift. | Selected for manual edits. |
| Python unittest | test runner | Fast API regression coverage for `redteam_v2_api_router`. | Does not replace live service smoke. | Selected. |
| Node `--check` | syntax validator | Fast frontend JavaScript parse validation. | Syntax-only, no UI runtime coverage. | Selected. |
| Vite build | frontend build | Validates bundle/transpile path. | Large chunk warning is not a functional failure. | Selected. |
| Git exact staging | SCM control | Prevents unrelated dirty worktree files from entering commit. | Requires careful path enumeration. | Selected. |

## Build vs Adopt
No new external dependency was needed. The slice extends existing RedTeam AX runtime models, FastAPI router patterns, frontend store methods, and unittest coverage.

## Selected Tool
Existing repository tooling plus knowledge workflow:
- `runtime/redteam_v2_models.py` and `runtime/redteam_v2_api_router.py` for backend contract.
- `tests/test_redteam_v2_api_router.py` for API regression.
- `reports.js` for RedTeam2 UI action wiring.
- `FINAL_PLAN.md` for official implementation-plan state.

## Verification
Toolchain verification completed with exit_code 0 for API regression, sample E2E, frontend syntax check, frontend build, and plan sanity.

