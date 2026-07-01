---
type: tool_decision
status: draft
project: Red-Team-Studio
task: Implement RedTeam AX v2 expected wrapper hash pin approval workflow slice
created: 2026-07-01T17:16:53+09:00
---

# Tool Decision

## Selected Tools

- `rg` for locating wrapper manifest and UI code.
- `apply_patch` for scoped edits.
- Bundled Python unittest for API regression.
- Bundled Node `--check` and `npm.cmd run build` for frontend validation.
- `knowledge_workflow.py` for evidence gate.

## Rationale

- Pin approval is an auditable artifact workflow, so it belongs in the v2 model/router layer next to ToolAction/HITL artifacts.
- The registry still must not execute version commands; version output is operator-attested evidence.
- `red_team_lead` was selected as the initial approver role because it already exists in the v2 RBAC model and fits tool trust decisions.

## Deferred

- Revoke/rotate workflow.
- Actual runner hard-block enforcement.
- Live browser smoke.

## 작업 목표

## 필요한 능력

## 후보 도구 비교

| 도구 | 장점 | 단점 | 기존 도구와 결합 | 판정 |
|---|---|---|---|---|
| 후보 1 |  |  |  |  |
| 후보 2 |  |  |  |  |
| 후보 3 |  |  |  |  |
| 후보 4 |  |  |  |  |
| 후보 5 |  |  |  |  |

## 선택한 도구 또는 도구 체인

## 선택 이유

## 버린 대안과 이유

## 실패 시 fallback

## 실제 사용 결과

## 다음 재사용 규칙

