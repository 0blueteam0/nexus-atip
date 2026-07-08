Tooling: detect-secrets 1.5.0, venv executable hash pinned, preset PRESET-DETECT-SECRETS-CLEAN-WORKSPACE, normalizer NORMALIZER-DETECT-SECRETS-001, agent AGENT-DETECT-SECRETS-ANALYST-001.
Evidence fields:
- command: detect-secrets --version
  exit_code: 0
  artifact_path: Red Team Studio/고도화/tool-manifests/detect_secrets_1.5.0_venv_manifest.json
  verified_at: 2026-07-07
- command: detect-secrets scan --all-files .
  exit_code: 0
  artifact_path: Red Team Studio/고도화/samples/detect_secrets_workspace
  verified_at: 2026-07-07
- command: .venv/Scripts/python.exe -m unittest selected RedTeamV2ApiRouterTests
  exit_code: 0
  artifact_path: tests/test_redteam_v2_api_router.py
  verified_at: 2026-07-07
- command: governed_toolchain_execution + collect_toolchain_results
  exit_code: 0
  artifact_path: archive/runs/redteam-ax-v2/CASE-V2-DETECT-SECRETS-SMOKE-0561d31d
  verified_at: 2026-07-07
