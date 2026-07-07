# Tooling

Verification commands:

```powershell
J:\PortableApps\genai\projects\ai-agentic-soc\.venv\Scripts\python.exe -m py_compile J:\PortableApps\genai\projects\ai-agentic-soc\runtime\redteam_v2_models.py J:\PortableApps\genai\projects\ai-agentic-soc\runtime\redteam_v2_api_router.py
node --check J:\PortableApps\genai\projects\ai-agentic-soc\soc-frontend-vite-react\soc-frontend\idiomatic-react\src\store\methods\reports.js
J:\PortableApps\genai\projects\ai-agentic-soc\.venv\Scripts\python.exe -m pytest J:\PortableApps\genai\projects\ai-agentic-soc\tests\test_redteam_v2_api_router.py -k "sca_import_only_install_evidence_records_operator_reviewed_sbom_without_execution or tool_install_version_evidence_records_operator_attested_versions or safe_smoke_candidate_batch_attestation_records_multiple_install_evidence"
python J:\PortableApps\genai\projects\ai-agentic-soc\Red Team Studio\고도화\sanity\redteam_ax_frontend_runtime_readiness_contract.py
python J:\PortableApps\genai\projects\ai-agentic-soc\Red Team Studio\고도화\sanity\redteam_ax_frontend_launch_readiness_contract.py
git -C J:\PortableApps\genai diff --check -- <changed paths>
```

All exited 0. No scanner process was started.
