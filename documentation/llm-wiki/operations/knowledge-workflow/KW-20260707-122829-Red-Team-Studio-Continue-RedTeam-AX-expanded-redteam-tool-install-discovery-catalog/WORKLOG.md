# Worklog

- Searched official and primary sources for current install guidance and candidate tools.
- Confirmed SPEC 24 requires a broader open-source tool catalog and onboarding flow.
- Added `DISCOVERED_TOOL_INSTALL_CANDIDATES` for:
  - OWASP Amass.
  - ffuf.
  - Nmap.
  - Gitleaks.
- Updated `list_tool_install_readiness()` to return `discovered_candidate_count`, `discovered_candidate_tools`, and `discovered_candidate_policy`.
- Updated RedTeam2 frontend to show `추가 설치 후보` separately from the required six tools.
- Updated backend regression and frontend runtime sanity.
- Updated Detailed_PLAN and FINAL_PLAN.

## Verification

- `py_compile redteam_v2_models.py redteam_v2_api_router.py` -> exit 0.
- `node --check reports.js` -> exit 0.
- `pytest tests/test_redteam_v2_api_router.py -k tool_install_readiness_exposes_operator_run_install_plans` -> 1 passed, exit 0.
- `redteam_ax_frontend_runtime_readiness_contract.py` -> exit 0.
- `redteam_ax_frontend_launch_readiness_contract.py` -> exit 0.
- `git diff --check -- <target files>` -> exit 0.
