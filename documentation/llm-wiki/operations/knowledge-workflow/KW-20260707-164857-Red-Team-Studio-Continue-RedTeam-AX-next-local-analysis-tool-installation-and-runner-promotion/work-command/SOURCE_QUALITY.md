Source quality: GitHub official release API and local command outputs are primary evidence. The sample workspace is a controlled repository artifact.
Evidence fields:
- command: yara64.exe --version
  exit_code: 0
  artifact_path: Red Team Studio/고도화/tool-manifests/yara_4.5.5_portable_manifest.json
  verified_at: 2026-07-07
- command: yara64.exe rules/redteam_ax_safe_indicator.yar input/benign_marker.txt
  exit_code: 0
  artifact_path: Red Team Studio/고도화/samples/yara_workspace
  verified_at: 2026-07-07
- command: .venv/Scripts/python.exe -m unittest selected RedTeamV2ApiRouterTests
  exit_code: 0
  artifact_path: tests/test_redteam_v2_api_router.py
  verified_at: 2026-07-07
- command: governed_toolchain_execution + collect_toolchain_results
  exit_code: 0
  artifact_path: archive/runs/redteam-ax-v2/CASE-V2-YARA-SMOKE-6cd9e004
  verified_at: 2026-07-07
