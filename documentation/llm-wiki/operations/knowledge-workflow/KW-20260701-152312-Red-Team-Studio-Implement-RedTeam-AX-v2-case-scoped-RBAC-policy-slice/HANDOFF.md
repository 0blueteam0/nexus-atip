---
type: handoff
status: active
project: Red Team Studio
updated: 2026-07-01T15:23:12+09:00
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

# Handoff

- from: codex
- to: claude/codex
- changed:
  - Added local case-scoped RBAC assignment registry.
  - Actor context now records `case_roles`, `effective_roles`, and `case_policy_source`.
  - Added `GET /api/redteam/v2/cases/{case_id}/rbac`.
  - Added tests and live smoke for unassigned case denial and assigned case approval.
- read_next:
  - `J:\PortableApps\genai\projects\ai-agentic-soc\Red Team Studio\FINAL_PLAN.md`
  - `J:\PortableApps\genai\projects\ai-agentic-soc\runtime\redteam_v2_models.py`
  - `J:\PortableApps\genai\projects\ai-agentic-soc\tests\test_redteam_v2_api_router.py`
- verification:
  - `python -m unittest tests.test_redteam_v2_api_router tests.test_redteam_v2_sample_e2e` -> exit_code 0
  - `npm.cmd run build` -> exit_code 0
  - Playwright smoke screenshot: `고도화/live-smoke/redteam2-case-rbac-export-flow.png`
- remaining:
  - Central user/group sync.
  - Case policy CRUD/API and admin UI.
  - Full release/security/starter-pack regression.
