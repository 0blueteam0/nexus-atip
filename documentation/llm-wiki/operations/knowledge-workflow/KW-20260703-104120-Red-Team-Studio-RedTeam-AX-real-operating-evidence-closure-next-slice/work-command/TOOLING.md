# Tooling

- `rg`: source and document location search.
- `apply_patch`: scoped edits.
- `.venv/Scripts/python.exe -m pytest`: API regression.
- `node --check`: JS syntax verification.
- `redteam_ax_accepted_gate_manifest.py`: accepted gate manifest generation.
- `knowledge_workflow.py close`: evidence session close gate.

Tooling change: accepted gate runner now writes stdout/stderr to log files and reads excerpts after completion.
