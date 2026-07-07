# Evidence Units

| id | evidence_type | command | exit_code | artifact_path | source_path | verified_at |
|---|---|---|---:|---|---|---|
| EU-001 | official_source | browser official release | 0 | https://github.com/zaproxy/zaproxy/releases/tag/v2.17.0 | OWASP ZAP release | 2026-07-07T15:25:23+09:00 |
| EU-002 | downloaded_archive | Get-FileHash ZAP_2.17.0_Crossplatform.zip | 0 | Red Team Studio/고도화/tools/zap/ZAP_2.17.0_Crossplatform.zip | official download URL | 2026-07-07T15:25:23+09:00 |
| EU-003 | launcher_hash | Get-FileHash zap.bat | 0 | Red Team Studio/고도화/tools/zap/ZAP_2.17.0/zap.bat | local install | 2026-07-07T15:25:23+09:00 |
| EU-004 | version_smoke | zap.bat -version | 0 | stdout 2.17.0 | local install | 2026-07-07T15:25:23+09:00 |
| EU-005 | runtime_manifest | inline model manifest check | 0 | n/a | runtime/redteam_v2_models.py | 2026-07-07T15:25:23+09:00 |
| EU-006 | governed_smoke | inline governed ZAP safe smoke | 0 | archive/runs/redteam-ax-v2/CASE-V2-ZAP-PORTABLE-SMOKE-caec0405 | runtime/redteam_v2_models.py | 2026-07-07T15:25:23+09:00 |
| EU-007 | tests | targeted unittest loader | 0 | n/a | tests/test_redteam_v2_api_router.py | 2026-07-07T15:25:23+09:00 |
| EU-008 | syntax | python -m py_compile redteam_v2_models.py | 0 | n/a | runtime/redteam_v2_models.py | 2026-07-07T15:25:23+09:00 |
| EU-009 | frontend | frontend runtime and launch sanity | 0 | n/a | Red Team Studio/고도화/sanity | 2026-07-07T15:25:23+09:00 |
| EU-010 | install_manifest | tracked manifest added | n/a | Red Team Studio/고도화/tool-manifests/owasp_zap_2.17.0_portable_manifest.json | local install evidence | 2026-07-07T15:25:23+09:00 |
