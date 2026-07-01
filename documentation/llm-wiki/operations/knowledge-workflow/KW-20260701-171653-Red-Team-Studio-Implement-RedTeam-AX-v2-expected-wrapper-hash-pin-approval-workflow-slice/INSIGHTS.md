---
type: insight
status: draft
project: Red-Team-Studio
created: 2026-07-01T17:16:53+09:00
---

# Insight

## 관찰

- Slice 25 manifest state needed a trust registry before runner enforcement can be meaningful.
- Existing actor binding helpers can be reused for wrapper pin approval.

## 통찰

- Pin approval should be separate from manifest reads: reads show state, approval mutates trust registry.
- Operator-attested version evidence is enough for this slice and avoids unexpected scanner process execution.

## 제안

- Add pin revoke/rotate next so compromised or upgraded wrappers can be safely replaced.
- Actual runner should consume `wrapper_preflight` and block when `runner_can_use_wrapper=false`.

## 적용 가능 범위

- RedTeam AX v2 analysis tool registry, ToolExecutionPlan, and Report Studio RedTeam2.

## 후속 작업

- Implement revoke/rotate endpoint and UI.
- Implement runner enforcement.
- Run live browser smoke.

