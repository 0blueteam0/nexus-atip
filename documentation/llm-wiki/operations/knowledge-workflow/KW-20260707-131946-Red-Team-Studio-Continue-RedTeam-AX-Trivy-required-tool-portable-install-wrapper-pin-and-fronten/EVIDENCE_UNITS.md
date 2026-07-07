# Evidence Units

| id | type | command/source | exit_code | evidence | verified_at |
|---|---|---|---:|---|---|
| EV-001 | official_source | https://github.com/aquasecurity/trivy/releases | n/a | Official Trivy release page/source for binary install | 2026-07-07T13:20:00+09:00 |
| EV-002 | official_docs | https://github.com/aquasecurity/trivy/blob/main/docs/getting-started/installation.md | n/a | Official installation options distinguish official install methods | 2026-07-07T13:20:00+09:00 |
| EV-003 | incident_source | https://github.com/aquasecurity/trivy/discussions/10425 | n/a | Known compromised Trivy v0.69.4 was considered and rejected | 2026-07-07T13:20:00+09:00 |
| EV-004 | release_probe | GitHub API `repos/aquasecurity/trivy/releases/latest` | 0 | Latest official release was v0.72.0, not v0.69.4 | 2026-07-07T13:20:00+09:00 |
| EV-005 | install_command | Invoke-WebRequest + Expand-Archive for `trivy_0.72.0_windows-64bit.zip` | 0 | Installed `Red Team Studio/고도화/tools/trivy/trivy.exe` | 2026-07-07T13:22:00+09:00 |
| EV-006 | version_probe | `trivy.exe --version` | 0 | `Version: 0.72.0` | 2026-07-07T13:22:00+09:00 |
| EV-007 | hash_probe | `Get-FileHash -Algorithm SHA256 trivy.exe` | 0 | SHA-256 `5c233d1514d6fd91f7a4f834beb92070f8a9793c71801f7f2149a7b30f90b821` | 2026-07-07T13:22:00+09:00 |
| EV-008 | runtime_manifest | Python `tool_wrapper_manifest('TOOL-TRIVY-001')` | 0 | `pinning_status=hash_match`, `trusted_for_runner=true` | 2026-07-07T13:23:00+09:00 |
| EV-009 | cli_scan | `trivy.exe fs --format json --offline-scan --skip-db-update Red Team Studio/고도화/samples/trivy_workspace` | 0 | JSON output contained lodash vulnerability candidates | 2026-07-07T13:24:00+09:00 |
| EV-010 | governed_execution | Python `governed_toolchain_execution` Trivy+Sigma | 0 | `status=executed`, `executed_count=2`, no errors | 2026-07-07T13:25:00+09:00 |
| EV-011 | result_collection | Python `collect_toolchain_results` | 0 | `collected_count=2`, `evidence_candidate_count=2`, Trivy required coverage complete | 2026-07-07T13:25:00+09:00 |
| EV-012 | compile | `python -m py_compile runtime/redteam_v2_models.py runtime/redteam_v2_api_router.py` | 0 | Python syntax valid | 2026-07-07T13:26:00+09:00 |
| EV-013 | pytest | `.venv/Scripts/python.exe -m pytest tests/test_redteam_v2_api_router.py -k ...` | 0 | 6 passed, 85 deselected, 1 warning | 2026-07-07T13:26:00+09:00 |
| EV-014 | frontend_sanity | runtime and launch readiness sanity scripts | 0 | Both RedTeam2 frontend contract checks passed | 2026-07-07T13:26:00+09:00 |
| EV-015 | frontend_syntax | `node --check soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js` | 0 | frontend reports.js syntax valid | 2026-07-07T13:26:00+09:00 |
