# Tooling

Commands used for verification:

```powershell
J:\PortableApps\genai\projects\ai-agentic-soc\.venv\Scripts\python.exe -m py_compile J:\PortableApps\genai\projects\ai-agentic-soc\runtime\redteam_v2_models.py
node --check J:\PortableApps\genai\projects\ai-agentic-soc\soc-frontend-vite-react\soc-frontend\idiomatic-react\src\store\methods\reports.js
J:\PortableApps\genai\projects\ai-agentic-soc\.venv\Scripts\python.exe -m pytest J:\PortableApps\genai\projects\ai-agentic-soc\tests\test_redteam_v2_api_router.py -k safe_local_smoke_allows_high_risk_version_only_dry_run
python J:\PortableApps\genai\projects\ai-agentic-soc\Red Team Studio\고도화\sanity\redteam_ax_frontend_runtime_readiness_contract.py
python J:\PortableApps\genai\projects\ai-agentic-soc\Red Team Studio\고도화\sanity\redteam_ax_frontend_launch_readiness_contract.py
git -C J:\PortableApps\genai diff --check -- <changed paths>
```

All commands exited 0. The pytest regression mocks `subprocess.run`, so no real scanner process was launched.
