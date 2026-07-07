# Evidence Units

- evidence_id: EV-GITLEAKS-OFFICIAL-RELEASE
  source_url: https://github.com/gitleaks/gitleaks/releases/tag/v8.30.1
  artifact_path: Red Team Studio/고도화/tool-manifests/gitleaks_8.30.1_portable_manifest.json
  verified_at: 2026-07-07
  result: Gitleaks v8.30.1 official release used.

- evidence_id: EV-GITLEAKS-CHECKSUM
  command: Get-FileHash gitleaks_8.30.1_windows_x64.zip
  exit_code: 0
  expected_sha256: d29144deff3a68aa93ced33dddf84b7fdc26070add4aa0f4513094c8332afc4e
  artifact_path: Red Team Studio/고도화/tool-manifests/gitleaks_8.30.1_portable_manifest.json
  verified_at: 2026-07-07

- evidence_id: EV-GITLEAKS-VERSION
  command: gitleaks.exe version
  exit_code: 0
  output: 8.30.1
  verified_at: 2026-07-07

- evidence_id: EV-GITLEAKS-CLEAN-SCAN
  command: gitleaks.exe detect --no-git --source . --report-format json --report-path - --redact --no-banner --log-level error --exit-code 0
  exit_code: 0
  output: []
  artifact_path: Red Team Studio/고도화/samples/gitleaks_workspace/README.md
  verified_at: 2026-07-07

- evidence_id: EV-GITLEAKS-BACKEND-REGRESSION
  command: .venv/Scripts/python.exe -m unittest selected RedTeamV2ApiRouterTests
  exit_code: 0
  result: 3 tests OK
  verified_at: 2026-07-07

- evidence_id: EV-GITLEAKS-FRONTEND-SANITY
  commands: frontend runtime readiness, frontend launch readiness, node --check reports.js
  exit_code: 0
  verified_at: 2026-07-07

- evidence_id: EV-GITLEAKS-GOVERNED-SMOKE
  command: governed_toolchain_execution + collect_toolchain_results for Sigma and Gitleaks
  exit_code: 0
  case_id: CASE-V2-GITLEAKS-SMOKE-21aa6908
  toolchain_id: TC-GITLEAKS-SMOKE-6c19fe7a
  result: executed_count=2, collected_count=2, agents include TOOL-GITLEAKS-001
  verified_at: 2026-07-07
