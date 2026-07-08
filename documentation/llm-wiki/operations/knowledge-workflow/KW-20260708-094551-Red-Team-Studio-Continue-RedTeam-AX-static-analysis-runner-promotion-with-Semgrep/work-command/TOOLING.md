---
type: work_command_record
task_id: KW-20260708-094551-Red-Team-Studio-Continue-RedTeam-AX-static-analysis-runner-promotion-with-Semgrep
project: Red Team Studio
task: Continue RedTeam AX static analysis runner promotion with Semgrep
created: 2026-07-08T09:45:51+09:00
source_package: K:/wiki/work command
---

# TOOLING

## Tool Need

## Candidates

| candidate | type | benefit | risk | decision |
|---|---|---|---|---|

## Build vs Adopt

## Selected Tool

## Verification

# Tooling

- Semgrep 1.168.0 installed in isolated venv.
- Version command: `semgrep.exe --version`.
- Safe scan command: `semgrep.exe scan --quiet --config rules/redteam_ax_print_observation.yml --json input/sample_helper.py`.
- Manifest: `Red Team Studio/고도화/tool-manifests/semgrep_1.168.0_tool_venv_manifest.json`.
- Runtime identifiers: `TOOL-SEMGREP-001`, `PRESET-SEMGREP-LOCAL-RULE-SAMPLE`, `NORMALIZER-SEMGREP-001`, `AGENT-SEMGREP-ANALYST-001`.
- Related existing paired smoke tool: `TOOL-BANDIT-001`.
