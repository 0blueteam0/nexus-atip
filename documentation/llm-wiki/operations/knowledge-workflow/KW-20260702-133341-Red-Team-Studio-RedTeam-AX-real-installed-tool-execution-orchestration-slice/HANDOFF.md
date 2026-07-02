---
type: handoff
status: active
project: Red-Team-Studio
updated: 2026-07-02T13:33:41+09:00
---

# Handoff

## 현재 상태

## 완료된 것

## 검증된 것

## 아직 위험한 것

## 열린 질문

## 다음 액션

## 반드시 읽을 문서

## 관련 도구와 스크립트

## 다시 논의하지 않아도 되는 결정



## Autofill Handoff

Current state: Added RedTeam AX v2 governed multi-toolchain execution endpoint and Korean RedTeam2 UI controls for running multiple installed analyzer commands through ToolActionCard, ExecutionPlan, token, wrapper gate, and runner allowlist.

Next action: Add real installed-tool live smoke for available scanner CLIs or implement OpenVAS/ZAP credential vault contract.

Required artifacts:
- J:/PortableApps/genai/projects/ai-agentic-soc/runtime/redteam_v2_models.py
- J:/PortableApps/genai/projects/ai-agentic-soc/runtime/redteam_v2_api_router.py
- J:/PortableApps/genai/projects/ai-agentic-soc/tests/test_redteam_v2_api_router.py
- J:/PortableApps/genai/projects/ai-agentic-soc/soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js
- J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2/CASE-V2-TOOLCHAIN-LOCAL-RUNNER-001
- J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-browser-smoke/latest_live_browser_parser_smoke.json
- J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/FINAL_PLAN.md
- J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/Detailed_PLAN.MD
- J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/completion-audit/redteam_ax_completion_audit_matrix.json
- J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/llm-wiki/LLM_WIKI_HOME.md

Required command evidence:
- ./.venv/Scripts/python.exe -m pytest tests/test_redteam_v2_api_router.py::RedTeamV2ApiRouterTests::test_v2_governed_toolchain_executes_multiple_installed_tool_steps -q => exit 0, 1 passed
- ./.venv/Scripts/python.exe -m pytest tests/test_redteam_v2_api_router.py -q => exit 0, 49 passed
- ./.venv/Scripts/python.exe -m pytest tests/test_redteam_v2_sample_e2e.py -q => exit 0, 1 passed
- node --check soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js => exit 0
- npm.cmd run build => exit 0
- ./.venv/Scripts/python.exe Red Team Studio/고도화/sanity/test_completion_audit_matrix.py => exit 0
- ./.venv/Scripts/python.exe Red Team Studio/고도화/sanity/test_plan_contract.py => exit 0
- ./.venv/Scripts/python.exe Red Team Studio/고도화/sanity/test_redteam2_korean_copy_inventory.py => exit 0
- ./.venv/Scripts/python.exe Red Team Studio/고도화/sanity/redteam_ax_live_browser_parser_smoke.py --allow-browser => exit 0, status passed
- Test-NetConnection 127.0.0.1:8765 after shutdown => False

Remaining risks:
- Unit tests mock installed CLI success for multi-toolchain execution; real host scanner/container runtime success remains unproven and tracked as a separate runtime smoke gap.

Future agent rule: start from this session directory and the project-specific source-of-truth ledgers before using chat history.
