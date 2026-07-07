---
type: evidence_units
task_id: KW-20260707-095407-Red-Team-Studio-Continue-RedTeam-AX-safe-smoke-result-to-evidence-workflow
project: Red-Team-Studio
task: Continue RedTeam AX safe smoke result to evidence workflow
created: 2026-07-07T09:54:07+09:00
---

# Evidence Units

| id | evidence_type | command_or_path | exit_code | result | verified_at |
|---|---|---|---:|---|---|
| EU-001 | command | `.venv/Scripts/python.exe -m py_compile runtime/redteam_v2_models.py` | 0 | Python syntax passed. | 2026-07-07 |
| EU-002 | command | `node --check soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js` | 0 | JavaScript syntax passed. | 2026-07-07 |
| EU-003 | command | `.venv/Scripts/python.exe -m pytest tests/test_redteam_v2_api_router.py -k safe_local_smoke_allows_high_risk_version_only_dry_run` | 0 | 1 selected test passed; subprocess was mocked. | 2026-07-07 |
| EU-004 | command | `python Red Team Studio/고도화/sanity/redteam_ax_frontend_runtime_readiness_contract.py` | 0 | Runtime readiness frontend contract passed. | 2026-07-07 |
| EU-005 | command | `python Red Team Studio/고도화/sanity/redteam_ax_frontend_launch_readiness_contract.py` | 0 | Launch readiness frontend contract passed. | 2026-07-07 |
| EU-006 | command | `git diff --check -- <changed paths>` | 0 | Whitespace check passed; only CRLF normalization warnings shown. | 2026-07-07 |
| EU-007 | artifact | `runtime/redteam_v2_models.py` | 0 | Added candidate projection with operator attestation required. | 2026-07-07 |
| EU-008 | artifact | `reports.js` | 0 | Added RedTeam2 install confirmation candidate table. | 2026-07-07 |
