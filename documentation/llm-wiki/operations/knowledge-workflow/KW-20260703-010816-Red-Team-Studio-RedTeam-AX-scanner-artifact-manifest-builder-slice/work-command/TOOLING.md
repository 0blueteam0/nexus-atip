# Tooling

## Used

- `rg` for current-state search.
- PowerShell UTF-8 file inspection for targeted source ranges.
- `apply_patch` for all edits.
- Project `.venv/Scripts/python.exe` for pytest and sanity scripts.
- `node --check` for frontend syntax validation.
- `redteam_ax_accepted_gate_manifest.py` for aggregate gates.

## Not Used

- No destructive git operations.
- No scanner execution.
- No Docker/WSL/OpenVAS/ZAP runtime start or network probe.
