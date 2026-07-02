---
type: evidence_unit
status: draft
id:
project: Red-Team-Studio
created: 2026-07-02T13:24:01+09:00
---

# Evidence Unit

## Claim

## Source

- source_type:
- path_or_url:
- command:
- exit_code:
- collected_at:

## Evidence

## Confidence

## Limits

## Related Decisions



## Autofill Evidence Unit

Claim: Added RedTeam AX v2 operator-attested scanner install/version evidence capture API, registry listing, regression tests, completion audit updates, Detailed_PLAN and LLM wiki references.

Source:
- source_type: local_session
- path_or_url: J:\PortableApps\genai\documentation\llm-wiki\operations\knowledge-workflow\KW-20260702-132401-Red-Team-Studio-RedTeam-AX-scanner-install-version-evidence-capture-slice
- command: knowledge_workflow.py autofill
- exit_code: pending_until_close
- collected_at: 2026-07-02T13:28:46+09:00

Evidence artifacts:
- J:/PortableApps/genai/projects/ai-agentic-soc/runtime/redteam_v2_models.py
- J:/PortableApps/genai/projects/ai-agentic-soc/runtime/redteam_v2_api_router.py
- J:/PortableApps/genai/projects/ai-agentic-soc/tests/test_redteam_v2_api_router.py
- J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2/CASE-V2-TOOL-INSTALL-EVIDENCE-001/tool-install-evidence
- J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/FINAL_PLAN.md
- J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/Detailed_PLAN.MD
- J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/completion-audit/redteam_ax_completion_audit_matrix.json
- J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/llm-wiki/LLM_WIKI_HOME.md

Command evidence:
- ./.venv/Scripts/python.exe -m pytest tests/test_redteam_v2_api_router.py -q => exit 0, 48 passed
- ./.venv/Scripts/python.exe -m pytest tests/test_redteam_v2_sample_e2e.py -q => exit 0, 1 passed
- ./.venv/Scripts/python.exe Red Team Studio/고도화/sanity/test_completion_audit_matrix.py => exit 0
- ./.venv/Scripts/python.exe Red Team Studio/고도화/sanity/test_plan_contract.py => exit 0
- ./.venv/Scripts/python.exe -m py_compile runtime/redteam_v2_models.py runtime/redteam_v2_api_router.py => exit 0

Limits:
- Actual scanner binary/container runtime smoke is still not proven in this environment and remains tracked by RTA-COMP-015; OpenVAS/ZAP credential vault remains a separate gap.
