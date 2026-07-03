# Tooling

## Used

- `rg`: located raw exposure strings in RedTeam2 code.
- `Get-Content -Encoding UTF8`: read focused code and docs chunks.
- `apply_patch`: modified frontend, sanity scripts, plans, wiki, audit docs, and KW files.
- `node --check`: validated JavaScript syntax.
- `python`: ran project sanity scripts and JSON validation.

## Commands

- `node --check .../reports.js`
- `python .../redteam_ax_frontend_launch_readiness_contract.py`
- `python .../test_redteam2_korean_copy_inventory.py`
- `python -m json.tool .../redteam_ax_completion_audit_matrix.json`
- `python .../test_completion_audit_matrix.py`

## Notes

- command: `./.venv/Scripts/python.exe .../redteam_ax_frontend_launch_readiness_contract.py`
  - exit_code: 1
  - evidence: PowerShell reported the executable was not recognized under `J:/PortableApps/genai`.
- fallback_command: `python .../redteam_ax_frontend_launch_readiness_contract.py`
  - exit_code: 0
  - result: system Python was used for sanity checks.
