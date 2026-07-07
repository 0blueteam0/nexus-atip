# Evidence Units

- evidence_id: EV-YARA-OFFICIAL-ASSET
  command: Invoke-RestMethod https://api.github.com/repos/VirusTotal/yara/releases/tags/v4.5.5
  exit_code: 0
  artifact_path: Red Team Studio/고도화/tool-manifests/yara_4.5.5_portable_manifest.json
  verified_at: 2026-07-07

- evidence_id: EV-YARA-ZIP-HASH
  command: Get-FileHash yara-4.5.5-2368-win64.zip
  exit_code: 0
  result: 352396c8a3d9b31b157a4820abd3b9347fc934a2314cdda8a4f566a5570163e4
  verified_at: 2026-07-07

- evidence_id: EV-YARA-VERSION
  command: yara64.exe --version
  exit_code: 0
  result: 4.5.5
  verified_at: 2026-07-07

- evidence_id: EV-YARA-BINARY-HASH
  command: Get-FileHash yara64.exe yarac64.exe
  exit_code: 0
  result: yara64=1c45eb279d820aba81fd41c22384428ebe44037cf5793be4b52a9d3b3df62b33; yarac64=5b6705b9a8dabf496bccf163a65887574290c97f8b999c8cb73df5417b04bbd7
  verified_at: 2026-07-07

- evidence_id: EV-YARA-SAFE-SMOKE
  command: yara64.exe rules/redteam_ax_safe_indicator.yar input/benign_marker.txt
  exit_code: 0
  result: RedTeamAxSafeIndicator input\benign_marker.txt
  artifact_path: Red Team Studio/고도화/samples/yara_workspace
  verified_at: 2026-07-07

- evidence_id: EV-YARA-BACKEND-FRONTEND
  command: py_compile; selected unittest; frontend runtime sanity; frontend launch sanity; node --check
  exit_code: 0
  verified_at: 2026-07-07

- evidence_id: EV-YARA-GOVERNED-SMOKE
  command: governed_toolchain_execution + collect_toolchain_results
  exit_code: 0
  case_id: CASE-V2-YARA-SMOKE-6cd9e004
  toolchain_id: TC-YARA-SMOKE-76499870
  result: executed_count=2; collected_count=2; agents include TOOL-YARA-001
  verified_at: 2026-07-07
