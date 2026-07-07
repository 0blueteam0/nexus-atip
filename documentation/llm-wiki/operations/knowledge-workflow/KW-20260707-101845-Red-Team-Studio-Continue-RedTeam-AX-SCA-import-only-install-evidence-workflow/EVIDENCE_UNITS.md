---
type: evidence_units
task_id: KW-20260707-101845-Red-Team-Studio-Continue-RedTeam-AX-SCA-import-only-install-evidence-workflow
project: Red-Team-Studio
task: Continue RedTeam AX SCA import-only install evidence workflow
created: 2026-07-07T10:18:45+09:00
---

# Evidence Units

| id | evidence_type | command_or_path | exit_code | result | verified_at |
|---|---|---|---:|---|---|
| EU-001 | command | `.venv/Scripts/python.exe -m py_compile runtime/redteam_v2_models.py runtime/redteam_v2_api_router.py` | 0 | Python syntax passed. | 2026-07-07 |
| EU-002 | command | `node --check soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js` | 0 | JS syntax passed. | 2026-07-07 |
| EU-003 | command | `.venv/Scripts/python.exe -m pytest tests/test_redteam_v2_api_router.py -k "sca_import_only_install_evidence_records_operator_reviewed_sbom_without_execution or tool_install_version_evidence_records_operator_attested_versions or safe_smoke_candidate_batch_attestation_records_multiple_install_evidence"` | 0 | 3 selected tests passed. | 2026-07-07 |
| EU-004 | command | `python Red Team Studio/고도화/sanity/redteam_ax_frontend_runtime_readiness_contract.py` | 0 | Runtime frontend contract passed. | 2026-07-07 |
| EU-005 | command | `python Red Team Studio/고도화/sanity/redteam_ax_frontend_launch_readiness_contract.py` | 0 | Launch frontend contract passed. | 2026-07-07 |
| EU-006 | command | `git diff --check -- <changed paths>` | 0 | Whitespace check passed; CRLF warnings only. | 2026-07-07 |
