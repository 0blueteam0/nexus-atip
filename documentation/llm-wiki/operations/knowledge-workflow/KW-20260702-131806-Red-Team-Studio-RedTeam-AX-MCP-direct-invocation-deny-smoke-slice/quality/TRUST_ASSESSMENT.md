---
type: trust_assessment
task_id: KW-20260702-131806-Red-Team-Studio-RedTeam-AX-MCP-direct-invocation-deny-smoke-slice
project: Red-Team-Studio
task: RedTeam AX MCP direct invocation deny smoke slice
created: 2026-07-02T13:18:06+09:00
---

# Trust Assessment

## Claims

| claim | confidence_1_to_5 | evidence | uncertainty | review_needed |
|---|---:|---|---|---|
|  |  |  |  |  |

## Overclaim Check

## Hallucination Check

## Bias Check

## Required Follow-Up


## Autofill Quality Evidence

Claim under assessment: RedTeam AX MCP direct invocation deny slice: added non-executing MCP direct invocation guard endpoint, persisted denial artifact, added API regression, and updated completion audit RTA-COMP-004 from partial to proved.

Confidence: evidence-backed for the listed artifacts and commands.
Uncertainty: any remaining risk listed below still requires follow-up.
Review needed: yes if the project-specific final gate is not clean.

Autofill timestamp: 2026-07-02T13:22:01+09:00
Project: Red-Team-Studio
Task: RedTeam AX MCP direct invocation deny smoke slice
Agent: codex
Status: ready_for_handoff
Summary: RedTeam AX MCP direct invocation deny slice: added non-executing MCP direct invocation guard endpoint, persisted denial artifact, added API regression, and updated completion audit RTA-COMP-004 from partial to proved.
Next action: Implement scanner install/version evidence capture or OpenVAS/ZAP credential vault contract.
Artifacts:
- J:/PortableApps/genai/projects/ai-agentic-soc/runtime/redteam_mcp_gateway_adapter.py
- J:/PortableApps/genai/projects/ai-agentic-soc/runtime/redteam_v2_models.py
- J:/PortableApps/genai/projects/ai-agentic-soc/runtime/redteam_v2_api_router.py
- J:/PortableApps/genai/projects/ai-agentic-soc/tests/test_redteam_v2_api_router.py
- J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2/CASE-V2-MCP-DIRECT-DENY-001/mcp-direct-denials/MCP-DENY-ADEF72FE4487.json
- J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/completion-audit/redteam_ax_completion_audit_matrix.json
- J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/FINAL_PLAN.md
Commands:
- J:/PortableApps/genai/projects/ai-agentic-soc/.venv/Scripts/python.exe -m pytest J:/PortableApps/genai/projects/ai-agentic-soc/tests/test_redteam_v2_api_router.py -k mcp_direct_invocation => exit 0, 1 passed
- python -m py_compile runtime/redteam_mcp_gateway_adapter.py runtime/redteam_v2_models.py runtime/redteam_v2_api_router.py => exit 0
- J:/PortableApps/genai/projects/ai-agentic-soc/.venv/Scripts/python.exe -m pytest J:/PortableApps/genai/projects/ai-agentic-soc/tests/test_redteam_v2_api_router.py => exit 0, 47 passed
- python J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/sanity/test_completion_audit_matrix.py => exit 0
- python J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/sanity/test_plan_contract.py => exit 0
- J:/PortableApps/genai/projects/ai-agentic-soc/.venv/Scripts/python.exe -m pytest J:/PortableApps/genai/projects/ai-agentic-soc/tests/test_redteam_v2_sample_e2e.py => exit 0, 1 passed
Risks:
- The full goal remains active_incomplete due scanner install/version evidence, OpenVAS/ZAP credential vault, full gate manifest, and real container runtime proof gaps.
