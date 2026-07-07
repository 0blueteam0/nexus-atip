# Scope

- Project: Red Team Studio / RedTeam AX.
- Task: connect execution preset `runner_steps` to the governed toolchain runner and result collection path.
- In scope:
  - Preserve `runner_steps[]` returned by `/api/redteam/v2/toolchains/execution-presets` in the RedTeam2 frontend draft.
  - Use preserved step metadata when the user presses the approved composite execution button.
  - Add backend regression for `execution-presets -> execute-governed -> collect-results`.
  - Update `Detailed_PLAN.MD`, `FINAL_PLAN.md`, and frontend sanity contract.
- Out of scope for this slice:
  - Full six-tool live execution evidence for Nuclei, OpenVAS, Trivy, SCA, npm audit, and OWASP ZAP.
  - High-risk active scan automation.
  - Evidence approval, Finding severity two-person approval, Claim-Evidence Matrix finalization, Report v2 export, and full completion gate.
