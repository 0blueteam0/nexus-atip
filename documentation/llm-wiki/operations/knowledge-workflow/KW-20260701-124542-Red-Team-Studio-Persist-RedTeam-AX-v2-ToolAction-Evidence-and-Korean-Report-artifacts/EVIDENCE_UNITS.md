---
type: evidence_units
task_id: KW-20260701-124542-Red-Team-Studio-Persist-RedTeam-AX-v2-ToolAction-Evidence-and-Korean-Report-artifacts
project: Red Team Studio
---

# Evidence Units

| id | evidence_type | source_path_or_command | claim_supported | exit_code |
|---|---|---|---|---:|
| EV-PERSIST-CODE | code | `runtime/redteam_v2_models.py` | JSON/Markdown artifact persistence implemented | 0 |
| EV-PERSIST-TEST | test | `tests/test_redteam_v2_sample_e2e.py` | sample E2E verifies artifact paths and Markdown sections | 0 |
| EV-LIVE-REPORT | artifact | `archive/runs/redteam-ax-v2/CASE-LIVE-REPORT-001/reports/RTRPT-573FF3632968.md` | Korean Report v2 artifact generated with Claim-Evidence Matrix | 0 |
| EV-REGRESSION | command | v2 sample E2E, v2 API, v1 API tests | focused regression passed | 0 |
