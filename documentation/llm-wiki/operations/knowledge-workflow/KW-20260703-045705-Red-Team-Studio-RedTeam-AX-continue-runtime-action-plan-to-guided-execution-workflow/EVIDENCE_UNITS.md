# Evidence Units

| id | type | command_or_path | result |
|---|---|---|---|
| EV-001 | code | runtime/redteam_v2_models.py | next_action_plan entries include frontend_action_key and redteam2_button_ko. |
| EV-002 | frontend | soc-frontend.../reports.js | 다음 실행 준비 단계 table includes 화면 버튼 column. |
| EV-003 | test | pytest runtime readiness focused test | 1 passed, 1 warning, exit 0. |
| EV-004 | test | pytest tests/test_redteam_v2_api_router.py -q | 73 passed, 1 warning, exit 0. |
| EV-005 | syntax | py_compile and node --check | exit 0. |
| EV-006 | sanity | frontend runtime readiness, Korean copy, plan contract, completion audit | all exit 0. |
| EV-007 | gate | redteam_ax_accepted_gate_manifest.py | rerun exit 0; 24 accepted gates passed. |
