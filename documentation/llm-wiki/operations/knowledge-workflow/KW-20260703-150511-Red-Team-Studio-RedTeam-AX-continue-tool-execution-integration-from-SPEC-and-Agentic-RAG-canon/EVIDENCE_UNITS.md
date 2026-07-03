---
type: evidence_unit
status: complete
id: EU-REDTEAM-AX-20260703-SAFE-SMOKE-EXPANSION
project: Red-Team-Studio
created: 2026-07-03T15:05:11+09:00
---

# Evidence Units

## EU-001

Claim: The backend syntax is valid.

Source: command `./.venv/Scripts/python.exe -m py_compile runtime/redteam_v2_models.py runtime/redteam_v2_api_router.py`, exit_code 0.

Evidence: command completed without errors.

## EU-002

Claim: The frontend syntax is valid.

Source: command `node --check soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js`, exit_code 0.

Evidence: command completed without errors.

## EU-003

Claim: High-risk scanner version-only dry-run smoke is allowed under partial readiness without active scan.

Source: command `./.venv/Scripts/python.exe tests/test_redteam_v2_api_router.py RedTeamV2ApiRouterTests.test_v2_toolchain_runtime_preflight_allows_safe_local_smoke_only_when_partial RedTeamV2ApiRouterTests.test_v2_toolchain_safe_local_smoke_allows_high_risk_version_only_dry_run ...`, exit_code 0.

Evidence: 5 related tests ran OK, including Nuclei/OpenVAS/ZAP dry_run version-only smoke.

## EU-004

Claim: Frontend launch/runtime/Korean copy contracts pass.

Source: launch readiness contract, runtime readiness contract, Korean copy inventory, exit_code 0.

Evidence: all three scripts printed pass messages.

## EU-005

Claim: Completion audit matrix remains structurally valid.

Source: `test_completion_audit_matrix.py` and `python -m json.tool`, exit_code 0.

Evidence: completion audit matrix sanity passed.

## EU-006

Claim: The overall goal is still incomplete.

Source: goal-completion-review TestClient request, exit_code 0.

Evidence: `goal_completion_blocked`, `remaining_gap_count=3`, `goal_status=active_incomplete`.

## EU-007

Claim: Full router test was not completed in this continuation.

Source: command `./.venv/Scripts/python.exe tests/test_redteam_v2_api_router.py`, interrupted after prolonged execution.

Evidence: process remained alive after several minutes and was stopped. This is recorded as residual validation risk, not a pass.
