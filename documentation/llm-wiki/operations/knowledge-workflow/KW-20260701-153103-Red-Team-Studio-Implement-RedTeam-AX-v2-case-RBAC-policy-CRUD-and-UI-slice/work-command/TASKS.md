---
type: work_command_record
task_id: KW-20260701-153103-Red-Team-Studio-Implement-RedTeam-AX-v2-case-RBAC-policy-CRUD-and-UI-slice
project: Red Team Studio
task: Implement RedTeam AX v2 case RBAC policy CRUD and UI slice
created: 2026-07-01T15:31:03+09:00
updated: 2026-07-01T16:25:00+09:00
source_package: K:/wiki/work command
---

# TASKS

## Original Request

RedTeam AX 목표를 계속 수행하되, `레드팀 분석2`의 case-scoped RBAC를 관리자 UI와 API CRUD 수준으로 고도화하고, 기본 sanity test와 GitHub push까지 수행한다.

## Task

1. Backend case RBAC policy artifact CRUD 구현.
2. Active policy artifact가 approval actor context에 반영되도록 resolver 보정.
3. `레드팀 분석2` Case RBAC Policy 패널 추가.
4. API/unit/live UI 검증.
5. `FINAL_PLAN.md`와 knowledge workflow evidence 업데이트.

## Status

Implemented and verified locally. Commit/push step remains after knowledge close.

## Execution Control

No destructive repository reset. Scoped edits only. High-risk redteam execution was not performed; all live checks were local policy/API/UI smoke tests.

## Tools

PowerShell, `rg`, `apply_patch`, project `.venv` Python, npm/Vite, Playwright, knowledge workflow close gate.

## Verification

- Backend v2 router tests: 24 OK.
- Sample E2E: 1 OK.
- Legacy router regression: 2 OK.
- Frontend build: OK.
- Live API smoke: policy active and approval actor source `case_policy_artifact`.
- Live UI smoke: screenshot saved.
