---
type: handoff
status: active
project: Red-Team-Studio
updated: 2026-07-01T17:06:33+09:00
---

# Handoff

## 현재 상태

RedTeam AX v2 slice 25 is implemented: safe CLI/API wrapper manifest and hash preflight foundation is connected to API, execution plans, UI, tests, and FINAL_PLAN.

## 완료된 것

- Added wrapper manifest registry/detail endpoints.
- Added command path/hash/pinning state to ToolProfile runtime status.
- Added wrapper manifest/preflight warning to ToolExecutionPlan.
- Added RedTeam2 `Tool Wrapper Manifest / Version Pinning` panel.
- Added API regression coverage.

## 검증된 것

- API regression: 35 tests OK.
- Sample E2E: 1 test OK.
- JS syntax check: OK.
- Frontend build: OK, existing Vite large chunk warning only.
- Plan contract sanity: OK.

## 아직 위험한 것

- Version command evidence is not collected.
- Expected SHA-256 pin registration/approval workflow is not implemented.
- Actual ephemeral/container runner does not yet hard-block on preflight.
- Live browser smoke against 5177/8765 was not run in this slice.

## 열린 질문

- Where should expected SHA-256 pins be stored and approved: ToolProfile config, case-scoped policy, or org-level trust registry?

## 다음 액션

- Add operator-attested version evidence capture.
- Add expected SHA-256 pin approval workflow.
- Wire actual runner to reject unpinned/mismatched wrappers.

## 반드시 읽을 문서

- `J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/FINAL_PLAN.md`
- `J:/PortableApps/genai/projects/ai-agentic-soc/runtime/redteam_v2_models.py`
- `J:/PortableApps/genai/projects/ai-agentic-soc/tests/test_redteam_v2_api_router.py`

## 관련 도구와 스크립트

- `J:/PortableApps/genai/tools/knowledge_workflow.py`
- `J:/PortableApps/genai/handoff.ps1`
- `Red Team Studio/고도화/sanity/test_plan_contract.py`

## 다시 논의하지 않아도 되는 결정

- Registry read APIs must not execute scanner/version commands.
- Import-only SCA is trusted without wrapper hash pinning.
- CLI/API wrappers need expected SHA-256 pin before runner trust.

