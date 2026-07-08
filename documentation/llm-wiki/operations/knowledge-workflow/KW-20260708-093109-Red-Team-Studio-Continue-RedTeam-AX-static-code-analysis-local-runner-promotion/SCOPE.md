# Scope

Project: Red Team Studio
Task: Continue RedTeam AX static code analysis local runner promotion

Scope includes selecting Bandit from SPEC 23 as the first Python static security scanner, installing Bandit 1.9.4 in the project venv, recording wrapper hash, adding a benign Python sample workspace, promoting Bandit to an optional RedTeam AX runner profile, adding preset/normalizer/LLM analyst agent support, updating plan files, and verifying actual execution plus backend/frontend sanity.

Out of scope: recursive project scans, arbitrary source paths, exploit script samples, Semgrep promotion, Finding promotion, report export, or full goal completion.

## Scope Evidence Fields

- command: rg -n "Bandit" SPEC
  exit_code: 0
  artifact_path: Red Team Studio/SPEC/23_CUSTOM_SCRIPT_FACTORY_SPEC.md
  verified_at: 2026-07-08
- command: bandit --version
  exit_code: 0
  artifact_path: Red Team Studio/고도화/tool-manifests/bandit_1.9.4_venv_manifest.json
  verified_at: 2026-07-08
