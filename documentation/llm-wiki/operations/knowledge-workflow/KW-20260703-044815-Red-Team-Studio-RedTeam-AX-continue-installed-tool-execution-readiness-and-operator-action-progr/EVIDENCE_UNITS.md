# Evidence Units

| id | type | command_or_path | result |
|---|---|---|---|
| EV-001 | code | runtime/redteam_v2_models.py | runtime-readiness returns next_action_plan, blocked_action_count, tool_execution_blocked_by, tool_execution_ready. |
| EV-002 | frontend | soc-frontend.../reports.js | RedTeam2 renders 도구 실행 가능 여부 and 다음 실행 준비 단계 table. |
| EV-003 | test | pytest tests/test_redteam_v2_api_router.py::RedTeamV2ApiRouterTests::test_runtime_readiness_status_is_read_only_artifact_projection -q | 1 passed, 1 warning. |
| EV-004 | test | pytest tests/test_redteam_v2_api_router.py -q | 73 passed, 1 warning. |
| EV-005 | syntax | py_compile runtime/redteam_v2_models.py runtime/redteam_v2_api_router.py; node --check reports.js | exit 0. |
| EV-006 | sanity | frontend runtime readiness contract, Korean copy inventory, plan contract, completion audit matrix | all passed. |
| EV-007 | gate | redteam_ax_accepted_gate_manifest.py | passed; 24 accepted gates, 24 passed, 0 failed. |
