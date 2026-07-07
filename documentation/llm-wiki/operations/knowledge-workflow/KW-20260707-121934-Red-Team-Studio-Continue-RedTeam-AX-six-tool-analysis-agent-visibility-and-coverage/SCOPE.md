# Scope

- Project: Red Team Studio / RedTeam AX.
- Task: make six required tool LLM analysis agent coverage explicit in backend collection results and Korean frontend UI.
- In scope:
  - Strengthen collection coverage so analysis coverage requires both normalized result and agent id.
  - Expose `analysis_agent_required_tool_ids`, `missing_analysis_agent_tool_ids`, agent counts, and row-level agent status.
  - Show a Korean beginner-first table for Nuclei/OpenVAS/Trivy/SCA/npm audit/OWASP ZAP agent coverage.
  - Update focused regression tests, frontend sanity, Detailed_PLAN, and FINAL_PLAN.
- Evidence fields:
  - source_path: `runtime/redteam_v2_models.py`, `reports.js`, `tests/test_redteam_v2_api_router.py`.
  - command: focused pytest, Python compile, Node syntax check, frontend sanity, diff check.
  - exit_code: all verification commands recorded in `WORKLOG.md` exited 0.
  - verified_at: 2026-07-07T12:25:00+09:00.
- Out of scope:
  - Installing missing external tools.
  - Running high-risk active scans.
  - Claiming final Evidence/Finding/Matrix/Report/export completion.
