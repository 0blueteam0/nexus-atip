---
type: evidence_units
task_id: KW-20260707-100314-Red-Team-Studio-Continue-RedTeam-AX-safe-smoke-candidate-operator-attestation-to-install-evidenc
project: Red-Team-Studio
task: Continue RedTeam AX safe smoke candidate operator attestation to install evidence registry
created: 2026-07-07T10:03:14+09:00
---

# Evidence Units

| id | evidence_type | command_or_path | exit_code | result | verified_at |
|---|---|---|---:|---|---|
| EU-001 | command | `.venv/Scripts/python.exe -m py_compile runtime/redteam_v2_models.py runtime/redteam_v2_api_router.py` | 0 | Python syntax passed. | 2026-07-07 |
| EU-002 | command | `node --check soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js` | 0 | JavaScript syntax passed. | 2026-07-07 |
| EU-003 | command | `.venv/Scripts/python.exe -m pytest tests/test_redteam_v2_api_router.py -k "safe_smoke_candidate_attestation_records_install_evidence_without_runner_unlock or safe_local_smoke_allows_high_risk_version_only_dry_run or tool_install_version_evidence_records_operator_attested_versions"` | 0 | 3 selected tests passed; subprocess mocked. | 2026-07-07 |
| EU-004 | command | `python Red Team Studio/고도화/sanity/redteam_ax_frontend_runtime_readiness_contract.py` | 0 | Runtime readiness frontend contract passed. | 2026-07-07 |
| EU-005 | command | `python Red Team Studio/고도화/sanity/redteam_ax_frontend_launch_readiness_contract.py` | 0 | Launch readiness frontend contract passed. | 2026-07-07 |
| EU-006 | command | `git diff --check -- <changed paths>` | 0 | Whitespace check passed; only CRLF normalization warnings shown. | 2026-07-07 |
