# Scope

- Project: Red Team Studio / RedTeam AX.
- Task: expand official-source red team tool install discovery catalog beyond the required six tools.
- In scope:
  - Add discovered install/onboarding candidates for OWASP Amass, ffuf, Nmap, and Gitleaks.
  - Expose candidates through `/api/redteam/v2/tool-install-readiness`.
  - Show candidates in the Korean RedTeam2 frontend as install candidates, not executable tools.
  - Update tests, sanity, Detailed_PLAN, and FINAL_PLAN.
- Evidence fields:
  - source_url: ProjectDiscovery Nuclei docs/GitHub, Trivy docs/GitHub, OWASP ZAP docs, Greenbone docs, OWASP Amass GitHub/docs, ffuf GitHub/wiki, Nmap official download/install guide, Gitleaks official site/GitHub.
  - source_path: `runtime/redteam_v2_models.py`, `reports.js`, `tests/test_redteam_v2_api_router.py`.
  - command: Python compile, Node syntax, focused pytest, frontend sanity, diff check.
  - exit_code: all verification commands exited 0.
  - verified_at: 2026-07-07T12:31:00+09:00.
