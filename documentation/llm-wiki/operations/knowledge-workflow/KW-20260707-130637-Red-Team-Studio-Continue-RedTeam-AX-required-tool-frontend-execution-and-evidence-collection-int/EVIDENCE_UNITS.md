# Evidence Units

| id | type | command/source | exit_code | evidence | verified_at |
|---|---|---|---:|---|---|
| EV-001 | official_source | https://github.com/projectdiscovery/nuclei/releases/latest | n/a | ProjectDiscovery official release was used for Nuclei install source | 2026-07-07T13:00:00+09:00 |
| EV-002 | install_command | Invoke-RestMethod GitHub release API, Invoke-WebRequest release asset, Expand-Archive | 0 | Installed `Red Team Studio/고도화/tools/nuclei/nuclei.exe` | 2026-07-07T13:00:00+09:00 |
| EV-003 | version_probe | `nuclei.exe -version` | 0 | Nuclei Engine Version `v3.11.0` | 2026-07-07T13:00:00+09:00 |
| EV-004 | hash_probe | `Get-FileHash -Algorithm SHA256 nuclei.exe` | 0 | SHA-256 `5315e0938ed80f60d78d90433d919bce5485eb94c61a1f36e3cb376e1285b7d5` | 2026-07-07T13:00:00+09:00 |
| EV-005 | runtime_manifest | `python -c "from runtime import redteam_v2_models as m; ... m.tool_wrapper_manifest('TOOL-NUCLEI-001')"` | 0 | `pinning_status=hash_match`, `trusted_for_runner=true`; launch readiness retains `human_approval_required` | 2026-07-07T13:00:00+09:00 |
| EV-006 | compile | `python -m py_compile runtime/redteam_v2_models.py runtime/redteam_v2_api_router.py` | 0 | Python syntax valid | 2026-07-07T13:00:00+09:00 |
| EV-007 | pytest | `.venv/Scripts/python.exe -m pytest tests/test_redteam_v2_api_router.py -k "tool_wrapper_manifest_reports_hash_pinning_status or command_availability_resolves_portable_tool_binary or tool_install_readiness_exposes_operator_run_install_plans or toolchain_launch_readiness_exposes_frontend_button_contract or toolchain_execution_presets"` | 0 | 6 passed, 85 deselected, 1 warning | 2026-07-07T13:00:00+09:00 |
| EV-008 | frontend_sanity | `.venv/Scripts/python.exe Red Team Studio/고도화/sanity/redteam_ax_frontend_runtime_readiness_contract.py` | 0 | RedTeam2 frontend runtime readiness contract passed | 2026-07-07T13:00:00+09:00 |
| EV-009 | frontend_sanity | `.venv/Scripts/python.exe Red Team Studio/고도화/sanity/redteam_ax_frontend_launch_readiness_contract.py` | 0 | RedTeam2 launch readiness frontend contract passed | 2026-07-07T13:00:00+09:00 |
| EV-010 | frontend_syntax | `node --check soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js` | 0 | frontend reports.js syntax valid | 2026-07-07T13:00:00+09:00 |
