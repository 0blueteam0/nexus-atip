Task summary: Install Bandit 1.9.4, add benign Python sample workspace, promote to optional runner, connect normalizer and LLM analyst agent, verify backend/frontend/governed smoke, and keep the global goal active.
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
