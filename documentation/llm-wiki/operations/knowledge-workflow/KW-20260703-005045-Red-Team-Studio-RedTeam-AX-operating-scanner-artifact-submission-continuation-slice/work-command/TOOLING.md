# Tooling

## Used

- `rg` for file and anchor discovery.
- PowerShell UTF-8 reads for targeted file inspection.
- `apply_patch` for source, docs, and workflow edits.
- Project `.venv/Scripts/python.exe` for pytest and sanity scripts.
- `node --check` for frontend syntax validation.
- `redteam_ax_accepted_gate_manifest.py` for aggregate acceptance validation.

## Not Used

- No scanner command, active scan, shell-expanded tool execution, Docker start, WSL start, OpenVAS endpoint probe, or ZAP daemon call was performed by this slice.
- ChatShare extraction was not rerun; the named skill was read for scope and the existing wiki/package state was preserved.
