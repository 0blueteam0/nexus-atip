---
type: evidence_unit
status: draft
id:
project: Red Team Studio
created: 2026-07-07T12:49:08+09:00
---

# Evidence Unit

## Claim

Sigma CLI has been installed in the project virtual environment and promoted to an optional governed local runner profile with result normalization.

## Source

- source_type: command
- path_or_url: J:/PortableApps/genai/projects/ai-agentic-soc/.venv/Scripts/sigma.exe
- command: `.venv\Scripts\sigma.exe version`
- exit_code: 0
- collected_at: 2026-07-07T12:55:00+09:00

- source_type: command
- path_or_url: Red Team Studio/고도화/samples/sigma_rules/redteam_ax_local_process_creation_check.yml
- command: `.venv\Scripts\sigma.exe check <sample rule>`
- exit_code: 0
- collected_at: 2026-07-07T12:56:00+09:00

- source_type: command
- path_or_url: governed toolchain execution smoke
- command: governed_toolchain_execution + collect_toolchain_results for TOOL-SIGMA-CLI-001
- exit_code: 0
- collected_at: 2026-07-07T12:58:00+09:00

## Evidence

- Sigma CLI version output: `3.0.3`.
- Sigma local rule check output reports 0 errors, 0 condition errors, and 0 issues.
- Tool readiness reports `TOOL-SIGMA-CLI-001` as `runner_ready` with wrapper `hash_match`.
- Governed toolchain execution status was `executed`; collection status was `collected`; parser was `sigma_cli_text`; analysis agent coverage was true when Sigma was requested as optional required id for the smoke.

## Confidence

High for local install and governed runner smoke. Medium for production readiness due dependency conflicts.

## Limits

This does not install Sigma plugins, convert rules to SIEM backends, deploy detections, or complete the required six-tool RedTeam AX workflow.

## Related Decisions

- Sigma CLI is optional and does not change the required six-tool coverage.
- Dependency isolation is required before production use.
