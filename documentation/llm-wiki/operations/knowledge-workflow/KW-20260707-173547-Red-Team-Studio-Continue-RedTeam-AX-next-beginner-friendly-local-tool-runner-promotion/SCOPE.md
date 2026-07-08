# Scope

Project: Red Team Studio
Task: Continue RedTeam AX next beginner-friendly local tool runner promotion

Scope includes installing detect-secrets 1.5.0 in the project venv, recording wrapper hash, adding a clean local sample workspace, promoting detect-secrets to an optional RedTeam AX runner profile, adding preset/normalizer/LLM analyst agent support, updating plan files, and verifying actual execution plus backend/frontend sanity.

Out of scope: committing real or realistic secrets, running audit/baseline mutation commands, arbitrary repository scans, secret rotation, Finding promotion, report export, or full goal completion.

## Scope Evidence Fields

- command: rg -n "detect-secrets" SPEC
  exit_code: 0
  artifact_path: Red Team Studio/SPEC/23_CUSTOM_SCRIPT_FACTORY_SPEC.md
  verified_at: 2026-07-08
- command: detect-secrets --version
  exit_code: 0
  artifact_path: Red Team Studio/고도화/tool-manifests/detect_secrets_1.5.0_venv_manifest.json
  verified_at: 2026-07-08
