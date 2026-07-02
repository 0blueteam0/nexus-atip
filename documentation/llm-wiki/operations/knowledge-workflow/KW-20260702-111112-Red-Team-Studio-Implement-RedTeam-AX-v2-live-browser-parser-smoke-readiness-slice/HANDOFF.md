---
type: handoff
status: active
project: Red-Team-Studio
updated: 2026-07-02T11:11:12+09:00
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

Current state: Slice 37 added a safe-by-default RedTeam AX live Report Studio browser/parser smoke readiness harness. The harness records 5177 frontend and 8765 backend readiness without browser automation by default, preserves trusted_as_instruction=false and commands_executed_by_api=false, and gates Playwright execution behind --allow-browser or REDTEAM_AX_LIVE_BROWSER_SMOKE=1. Current evidence shows backend 8765 v1/v2 health ready and frontend 5177 not listening.

Next action: Continue from the recorded handoff and latest evidence.

Required artifacts:
- J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/sanity/redteam_ax_live_browser_parser_smoke.py
- J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-browser-smoke/latest_live_browser_parser_smoke.json
- J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/FINAL_PLAN.md

Required command evidence:
- python Red Team Studio/고도화/sanity/redteam_ax_live_browser_parser_smoke.py -> exit 0, blocked_live_services_not_ready, blocker live_frontend_5177_not_ready
- python -m py_compile Red Team Studio/고도화/sanity/redteam_ax_live_browser_parser_smoke.py -> exit 0
- J:/PortableApps/genai/projects/ai-agentic-soc/.venv/Scripts/python.exe -m unittest discover -s tests -p test_redteam_v2_api_router.py -> exit 0, 42 tests OK
- J:/PortableApps/genai/projects/ai-agentic-soc/.venv/Scripts/python.exe -m unittest discover -s tests -p test_redteam_v2_sample_e2e.py -> exit 0, 1 test OK
- node --check reports.js -> exit 0
- npm.cmd run build -> exit 0
- python Red Team Studio/고도화/sanity/test_plan_contract.py -> exit 0

Remaining risks:
- Live browser DOM/parser smoke remains blocked until http://127.0.0.1:5177 is running. The harness records this as evidence and exits non-zero only with --require-live.

Future agent rule: start from this session directory and the project-specific source-of-truth ledgers before using chat history.
