---
type: work_command_record
task_id: KW-20260701-172341-Red-Team-Studio-Implement-RedTeam-AX-v2-wrapper-trust-revoke-rotate-and-runner-enforcement-slice
project: Red-Team-Studio
task: Implement RedTeam AX v2 wrapper trust revoke rotate and runner enforcement slice
created: 2026-07-01T17:23:42+09:00
source_package: K:/wiki/work command
---

# TASKS

## Original Request
Continue RedTeam AX v2 implementation from the established platform goal: enforce ROE/HITL/guardrails for approved red-team tools, preserve Evidence Card and Claim-Evidence traceability, keep `FINAL_PLAN.md` current, add sanity/regression tests, and push the result to GitHub.

## Task
Implement the wrapper trust revoke/rotate and runner enforcement slice:
- Add an API workflow to revoke approved tool wrapper SHA-256 pins.
- Treat a newly approved pin request for the same tool profile as a rotation and surface the rotation warning.
- Exclude revoked pins from wrapper manifests and approved-pin lookup.
- Hard-block wrapper-backed execution plans when wrapper preflight requires an approved pin but the runner would execute before trust is established.
- Add RedTeam2 UI controls for revoking the active wrapper pin.
- Update `FINAL_PLAN.md` with slice status, remaining risks, and verification coverage.

## Status
Completed for this implementation slice. The broader RedTeam AX goal remains active because actual containerized/ephemeral scanner execution and live browser smoke on `127.0.0.1:5177` / `127.0.0.1:8765` are still outside this slice.

## Execution Control
No destructive commands were used. Staging must remain exact because the repository has many unrelated modified/untracked/deleted files. Runtime execution remains simulated/preflight-only for this slice; no scanner binary or network attack command was executed.

## Tools
- `rg` and targeted file reads for source inspection.
- `apply_patch` for source, test, UI, plan, and workflow documentation edits.
- Python unittest for API regression.
- Node syntax check for the frontend store method.
- Vite production build for frontend sanity.
- Project plan sanity script.

## Verification
- Command: `python -m unittest discover -s tests -p "test_redteam_v2_api_router.py"`; exit_code: 0; result: `Ran 37 tests OK`.
- Command: `node --check soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js`; exit_code: 0.
- Command: `python -m unittest tests.test_redteam_v2_sample_e2e`; exit_code: 0; result: `Ran 1 test OK`.
- Command: `npm run build` in `soc-frontend-vite-react/soc-frontend/idiomatic-react`; exit_code: 0; result: Vite build completed with existing large chunk warning.
- Command: `node scripts/redteam_ax_plan_sanity.mjs`; exit_code: 0; result: `[+] plan contract sanity passed`.

