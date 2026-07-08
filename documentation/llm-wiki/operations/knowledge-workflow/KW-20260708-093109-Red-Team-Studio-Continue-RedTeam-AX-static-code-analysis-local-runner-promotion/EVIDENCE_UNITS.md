# Evidence Units

- evidence_id: EV-BANDIT-SPEC
  command: rg -n "Bandit" SPEC
  exit_code: 0
  source_path: Red Team Studio/SPEC/23_CUSTOM_SCRIPT_FACTORY_SPEC.md
  verified_at: 2026-07-08
  result: SPEC 23 lists Bandit under Python static security checks.

- evidence_id: EV-BANDIT-LATEST
  command: .venv/Scripts/python.exe -m pip index versions bandit
  exit_code: 0
  result: latest=1.9.4
  verified_at: 2026-07-08

- evidence_id: EV-BANDIT-INSTALL
  command: .venv/Scripts/python.exe -m pip install bandit==1.9.4
  exit_code: 0
  artifact_path: .venv/Scripts/bandit.exe
  verified_at: 2026-07-08

- evidence_id: EV-BANDIT-VERSION
  command: bandit --version
  exit_code: 0
  result: bandit 1.9.4
  verified_at: 2026-07-08

- evidence_id: EV-BANDIT-HASH
  command: Get-FileHash .venv/Scripts/bandit.exe
  exit_code: 0
  result: f199eb3629af660d8a99389ca6f6c547d510a114a70fd4ed41864c0f4cac41a6
  verified_at: 2026-07-08

- evidence_id: EV-BANDIT-SAFE-SCAN
  command: bandit -q -f json safe_helper.py
  exit_code: 0
  artifact_path: Red Team Studio/고도화/samples/bandit_workspace
  result: JSON results=[]
  verified_at: 2026-07-08

- evidence_id: EV-BANDIT-BACKEND-FRONTEND
  command: py_compile; selected unittest; frontend runtime sanity; frontend launch sanity; node --check
  exit_code: 0
  verified_at: 2026-07-08

- evidence_id: EV-BANDIT-GOVERNED-SMOKE
  command: governed_toolchain_execution + collect_toolchain_results
  exit_code: 0
  case_id: CASE-V2-BANDIT-SMOKE-51b436da
  toolchain_id: TC-BANDIT-SMOKE-0f6e4fe1
  result: executed_count=2; collected_count=2; agents include TOOL-BANDIT-001
  verified_at: 2026-07-08
