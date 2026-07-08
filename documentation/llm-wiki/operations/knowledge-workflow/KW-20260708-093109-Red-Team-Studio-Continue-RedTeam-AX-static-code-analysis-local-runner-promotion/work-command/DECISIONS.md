Decision ledger: Bandit is optional local Python static security coverage. It is safe only for approved single-file scans and must not run recursive or arbitrary source scans from a frontend button.
Evidence fields:
- command: bandit --version
  exit_code: 0
  artifact_path: Red Team Studio/고도화/tool-manifests/bandit_1.9.4_venv_manifest.json
  verified_at: 2026-07-08
- command: bandit -q -f json safe_helper.py
  exit_code: 0
  artifact_path: Red Team Studio/고도화/samples/bandit_workspace
  verified_at: 2026-07-08
- command: .venv/Scripts/python.exe -m unittest selected RedTeamV2ApiRouterTests
  exit_code: 0
  artifact_path: tests/test_redteam_v2_api_router.py
  verified_at: 2026-07-08
- command: governed_toolchain_execution + collect_toolchain_results
  exit_code: 0
  artifact_path: archive/runs/redteam-ax-v2/CASE-V2-BANDIT-SMOKE-51b436da
  verified_at: 2026-07-08
