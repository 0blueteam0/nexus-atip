# Decisions

- Decision: Treat Gitleaks as optional runner coverage, not core completion coverage.
  Evidence: runtime profile uses `required_for_core_coverage=false` and `optional_runner_profile=true`.
  Verified_at: 2026-07-07

- Decision: Force `--log-level error` in the preset.
  Evidence: clean sample scan returned parseable stdout `[]` with exit_code 0.
  Verified_at: 2026-07-07

- Decision: Keep positive detection as redacted JSON unit fixture instead of committed secret-like sample files.
  Evidence: sample workspace README states it is intentionally clean.
  Verified_at: 2026-07-07

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
