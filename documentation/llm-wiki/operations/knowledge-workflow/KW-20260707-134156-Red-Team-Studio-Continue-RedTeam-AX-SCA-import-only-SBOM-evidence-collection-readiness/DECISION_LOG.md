# Decision Log

| decision | rationale | command | exit_code | source_path | artifact_path | verified_at | status |
|---|---|---|---:|---|---|---|---|
| Add committed CycloneDX sample fixture | SCA has no runner, so reproducibility depends on a stable import file | Test-Path sample plus model smoke | 0 | Red Team Studio/고도화/samples/sca_cyclonedx/redteam_ax_sample_sbom.cdx.json | same | 2026-07-07T13:51:57+09:00 | accepted |
| Keep SCA import-only | Avoid scanner execution without org backend/API vault controls | list_toolchain_execution_presets | 0 | runtime/redteam_v2_models.py | n/a | 2026-07-07T13:51:57+09:00 | accepted |
| Add sample path to execution presets and import guidance | Frontend and tests can call same path | targeted unittest loader | 0 | tests/test_redteam_v2_api_router.py | n/a | 2026-07-07T13:51:57+09:00 | accepted |
| Use direct unittest loader after pytest hang | Need bounded verification without leaving process running | direct unittest loader | 0 | tests/test_redteam_v2_api_router.py | n/a | 2026-07-07T13:51:57+09:00 | accepted |
