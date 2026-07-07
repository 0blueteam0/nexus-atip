# Evidence Units

| id | type | command/source | exit_code | evidence | verified_at |
|---|---|---|---:|---|---|
| EV-001 | runtime_manifest | Python `tool_wrapper_manifest('TOOL-NPM-AUDIT-001')` | 0 | npm.cmd resolved to Hermes node path, `pinning_status=hash_match`, `trusted_for_runner=true` | 2026-07-07T13:32:00+09:00 |
| EV-002 | source_artifact | `Red Team Studio/고도화/samples/npm_audit_workspace/package.json`, `package-lock.json` | n/a | lodash 4.17.20 sample lockfile for local audit smoke | 2026-07-07T13:35:00+09:00 |
| EV-003 | direct_cli | `npm.cmd audit --json --package-lock-only` in sample workspace | 1 | JSON advisory output returned; exit code 1 due vulnerabilities found | 2026-07-07T13:36:00+09:00 |
| EV-004 | code_change | runtime runner working_dir and acceptable_exit_codes | n/a | workspace-only cwd gate and npm audit [0,1] exit code policy | 2026-07-07T13:38:00+09:00 |
| EV-005 | governed_execution | Python `governed_toolchain_execution` npm audit + Sigma | 0 | `run_status=executed`, npm runner `exit_code=1`, `exit_code_policy=accepted`, cwd sample workspace | 2026-07-07T13:39:00+09:00 |
| EV-006 | result_collection | Python `collect_toolchain_results` | 0 | `collected_count=2`, `evidence_candidate_count=2`, npm audit required coverage complete | 2026-07-07T13:39:00+09:00 |
| EV-007 | compile | `python -m py_compile runtime/redteam_v2_models.py runtime/redteam_v2_api_router.py` | 0 | Python syntax valid | 2026-07-07T13:40:00+09:00 |
| EV-008 | pytest | `.venv/Scripts/python.exe -m pytest tests/test_redteam_v2_api_router.py -k ...` | 0 | 4 passed, 87 deselected, 1 warning | 2026-07-07T13:40:00+09:00 |
| EV-009 | frontend_sanity | runtime and launch readiness sanity scripts | 0 | both RedTeam2 frontend contract checks passed | 2026-07-07T13:40:00+09:00 |
| EV-010 | frontend_syntax | `node --check soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js` | 0 | frontend reports.js syntax valid | 2026-07-07T13:40:00+09:00 |
