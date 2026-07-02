# Tooling

Used:

- `rg` and UTF-8 `Get-Content` for source inspection.
- `apply_patch` for scoped edits.
- `.venv\Scripts\python.exe` for validator generation, pytest, sanity contracts, and accepted gate manifest.
- `node --check` for frontend syntax.

Not used:

- Docker daemon execution.
- WSL distro start.
- OpenVAS/ZAP live network calls.
- Any active scanner command.
