# Decision Log

| decision | rationale | command | exit_code | source_path | artifact_path | verified_at | status |
|---|---|---|---:|---|---|---|---|
| Use OWASP ZAP 2.17.0 cross-platform package | Official current release and Java 17 available | zap.bat -version | 0 | official release | local tools/zap | 2026-07-07T15:25:23+09:00 | accepted |
| Pin zap.bat launcher hash | Runtime wrapper trust needs a stable local executable hash | Get-FileHash zap.bat | 0 | local launcher | manifest json | 2026-07-07T15:25:23+09:00 | accepted |
| Expose ZAP as safe_smoke_steps not runner_steps | Avoid mixing version check with analysis execution | execution presets regression | 0 | runtime/redteam_v2_models.py | n/a | 2026-07-07T15:25:23+09:00 | accepted |
| Keep active scan disabled | ROE/HITL and target scope approval required | governed smoke | 0 | runtime policy | n/a | 2026-07-07T15:25:23+09:00 | accepted |
