# Evidence Units

- EU-001: `runtime/redteam_v2_models.py` defines `list_toolchain_launch_readiness()` and returns safe flags with `commands_executed_by_api=false`.
- EU-002: `runtime/redteam_v2_api_router.py` exposes `GET /api/redteam/v2/toolchains/launch-readiness`.
- EU-003: `tests/test_redteam_v2_api_router.py::test_v2_toolchain_launch_readiness_exposes_frontend_button_contract` passed.
- EU-004: `reports.js` loads `launchReadinessRes` and renders the Korean launch readiness table.
- EU-005: `redteam_ax_frontend_launch_readiness_contract.py` passed.
- EU-006: completion audit matrix JSON validates and RTA-COMP-059 is proved while RTA-COMP-015 remains partial.
- EU-007: goal-completion-review returned `goal_completion_blocked 1 3 False`.