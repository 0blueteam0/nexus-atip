# Tooling

Tool: Gitleaks
Version: 8.30.1
Official release: https://github.com/gitleaks/gitleaks/releases/tag/v8.30.1
Local binary: Red Team Studio/고도화/tools/gitleaks/gitleaks.exe
Binary SHA-256: 17157e2ee8b76fc8b1d8bee607a250e34b8a8023c8bc81822d4b5ee4d78fcb7c
Runner preset: PRESET-GITLEAKS-WORKSPACE-REDACTED-JSON
Normalizer: NORMALIZER-GITLEAKS-001
Agent: AGENT-GITLEAKS-ANALYST-001

## Evidence Fields

- command: gitleaks.exe version
  exit_code: 0
  artifact_path: Red Team Studio/고도화/tool-manifests/gitleaks_8.30.1_portable_manifest.json
  verified_at: 2026-07-07
  result: Installed Gitleaks returned version 8.30.1.

- command: gitleaks.exe detect --no-git --source . --report-format json --report-path - --redact --no-banner --log-level error --exit-code 0
  exit_code: 0
  artifact_path: Red Team Studio/고도화/samples/gitleaks_workspace/README.md
  verified_at: 2026-07-07
  result: Clean sample scan returned JSON [] without storing secret values.

- command: .venv/Scripts/python.exe -m unittest selected RedTeamV2ApiRouterTests
  exit_code: 0
  artifact_path: tests/test_redteam_v2_api_router.py
  verified_at: 2026-07-07
  result: Execution preset, runner collect path, and normalizer regression passed.

- command: governed_toolchain_execution + collect_toolchain_results
  exit_code: 0
  artifact_path: archive/runs/redteam-ax-v2/CASE-V2-GITLEAKS-SMOKE-21aa6908
  verified_at: 2026-07-07
  result: Gitleaks optional runner was executed and collected with analyst summary.
