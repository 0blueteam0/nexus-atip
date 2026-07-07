# Evidence Units

| id | evidence_type | command | exit_code | artifact_path | source_path | verified_at |
|---|---|---|---:|---|---|---|
| EU-001 | source_change | git diff -- runtime redteam tests plans sample | 0 | n/a |
untime/redteam_v2_models.py | 2026-07-07T13:50:38+09:00 |
| EU-002 | sample_fixture | n/a | n/a | J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/samples/sca_cyclonedx/redteam_ax_sample_sbom.cdx.json | same | 2026-07-07T13:50:38+09:00 |
| EU-003 | compile | python -m py_compile runtime/redteam_v2_models.py | 0 | n/a |
untime/redteam_v2_models.py | 2026-07-07T13:50:38+09:00 |
| EU-004 | frontend_syntax |
ode --check soc-frontend.../reports.js | 0 | n/a | soc-frontend-vite-react/.../reports.js | 2026-07-07T13:50:38+09:00 |
| EU-005 | frontend_runtime_sanity | python Red Team Studio/고도화/sanity/redteam_ax_frontend_runtime_readiness_contract.py | 0 | n/a | sanity script | 2026-07-07T13:50:38+09:00 |
| EU-006 | frontend_launch_sanity | python Red Team Studio/고도화/sanity/redteam_ax_frontend_launch_readiness_contract.py | 0 | n/a | sanity script | 2026-07-07T13:50:38+09:00 |
| EU-007 | model_smoke | .venv python inline governed SCA sample smoke | 0 | rchive/runs/redteam-ax-v2/CASE-V2-SCA-SAMPLE-SMOKE-89ceeb51/... | sample SBOM | 2026-07-07T13:50:38+09:00 |
| EU-008 | targeted_unittest | .venv python inline unittest loader | 0 | n/a | 	ests/test_redteam_v2_api_router.py | 2026-07-07T13:50:38+09:00 |
| EU-009 | external_source | web search/open official CycloneDX pages | 0 | https://cyclonedx.org/specification/overview/ | CycloneDX official docs | 2026-07-07T13:50:38+09:00 |
| EU-010 | external_schema | web search official schema | 0 | https://github.com/CycloneDX/specification/blob/master/schema/bom-1.5.schema.json | CycloneDX official schema | 2026-07-07T13:50:38+09:00 |
