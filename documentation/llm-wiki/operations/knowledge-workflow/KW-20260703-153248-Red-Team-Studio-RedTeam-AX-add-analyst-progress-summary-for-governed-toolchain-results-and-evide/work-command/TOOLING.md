# Work Command Tooling

## Tools Used

- `rg` for locating contracts and confirming inserted terms.
- `apply_patch` for scoped edits.
- Python virtual environment at `J:/PortableApps/genai/projects/ai-agentic-soc/.venv/Scripts/python.exe` for compile, sanity, audit, and API tests.
- `node --check` for frontend syntax.
- `knowledge_workflow.py` for evidence session close.

## Tooling Notes

- The initial relative `.venv` path under `Red Team Studio` was wrong; the correct venv is under `projects/ai-agentic-soc`.
- Korean path tests used `PYTHONUTF8=1` and PowerShell UTF-8 output encoding to avoid mojibake.
- No browser automation, active scanning, Docker, WSL, OpenVAS service call, or ZAP daemon call was used in this slice.
