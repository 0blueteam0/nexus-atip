# Tooling

## Commands Used

- `rg`: source and gap discovery
- `apply_patch`: edits
- `.venv/Scripts/python.exe -m py_compile`: Python syntax
- `.venv/Scripts/python.exe -m pytest tests/test_redteam_v2_api_router.py -q`: API regression
- `.venv/Scripts/python.exe Red Team Studio/고도화/sanity/*.py`: sanity gates
- `node --check`: frontend syntax
- `redteam_ax_accepted_gate_manifest.py`: accepted gate manifest

## Tooling Notes

No destructive git operations were used. No scanner, Docker, WSL, active scan, or network probe command was executed for the new API path.

## Verification Summary

- API router: 64 passed
- accepted gates: 24/24 passed
- Korean copy inventory: passed
- runtime readiness contract: passed
