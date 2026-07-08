# Evidence Units

- evidence_id: EV-DETECT-SECRETS-SPEC
  command: rg -n "detect-secrets" SPEC
  exit_code: 0
  source_path: Red Team Studio/SPEC/23_CUSTOM_SCRIPT_FACTORY_SPEC.md
  verified_at: 2026-07-07
  result: SPEC 23 lists detect-secrets under Secret scan.

- evidence_id: EV-DETECT-SECRETS-INSTALL
  command: .venv/Scripts/python.exe -m pip install detect-secrets==1.5.0
  exit_code: 0
  artifact_path: .venv/Scripts/detect-secrets.exe
  verified_at: 2026-07-07

- evidence_id: EV-DETECT-SECRETS-VERSION
  command: detect-secrets --version
  exit_code: 0
  result: 1.5.0
  verified_at: 2026-07-07

- evidence_id: EV-DETECT-SECRETS-HASH
  command: Get-FileHash .venv/Scripts/detect-secrets.exe
  exit_code: 0
  result: c0e60ad13a23b9d57d8add12eee269e74966789604ea5f09e90cda859fc617cf
  verified_at: 2026-07-07

- evidence_id: EV-DETECT-SECRETS-CLEAN-SCAN
  command: detect-secrets scan --all-files .
  exit_code: 0
  artifact_path: Red Team Studio/고도화/samples/detect_secrets_workspace
  result: baseline JSON results={}
  verified_at: 2026-07-07

- evidence_id: EV-DETECT-SECRETS-BACKEND-FRONTEND
  command: py_compile; selected unittest; frontend runtime sanity; frontend launch sanity; node --check
  exit_code: 0
  verified_at: 2026-07-07

- evidence_id: EV-DETECT-SECRETS-GOVERNED-SMOKE
  command: governed_toolchain_execution + collect_toolchain_results
  exit_code: 0
  case_id: CASE-V2-DETECT-SECRETS-SMOKE-0561d31d
  toolchain_id: TC-DETECT-SECRETS-SMOKE-2c9a0b95
  result: executed_count=2; collected_count=2; agents include TOOL-DETECT-SECRETS-001
  verified_at: 2026-07-07
