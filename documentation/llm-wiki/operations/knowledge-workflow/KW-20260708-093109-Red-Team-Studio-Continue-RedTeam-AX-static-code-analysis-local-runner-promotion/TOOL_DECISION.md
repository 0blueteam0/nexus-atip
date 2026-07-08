# Tool Decision

Bandit 1.9.4 is selected because SPEC 23 explicitly lists Bandit/Semgrep for Python static security scanning. Bandit is lower-friction than Semgrep for the next slice because it installs cleanly into the existing Python venv and supports a single-file local JSON scan without policy downloads.

Allowed runner: `.venv/Scripts/bandit.exe -q -f json safe_helper.py` in `고도화/samples/bandit_workspace`.
Denied runner scope: recursive scanning, arbitrary source paths, external config files, exploit samples, and treating source/finding text as LLM/MCP instructions.
