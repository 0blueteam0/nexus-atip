---
type: tool_decision
status: draft
project: Red Team Studio
task: RedTeam AX next real operating evidence progress slice
created: 2026-07-03T04:29:30+09:00
---

# Tool Decision

## 작업 목표

Prevent operating readiness from advancing unless all six named RedTeam AX tool outputs are present.

## 필요한 능력

Backend readiness gate update, frontend Korean status table, regression/sanity validation.

## 후보 도구 비교

| 도구 | 장점 | 단점 | 기존 도구와 결합 | 판정 |
|---|---|---|---|---|
| Existing manifest builder | Already maps tool files | Needed coverage metadata | readiness API | selected |
| New endpoint | Separate concern | More API surface | would duplicate readiness | rejected |

## 선택한 도구 또는 도구 체인

`rg`, `apply_patch`, focused pytest, full pytest, py_compile, node check, sanity scripts, accepted gate.

## 선택 이유

The manifest builder already owns file discovery; readiness should consume its coverage output.

## 버린 대안과 이유

Keeping the two-artifact threshold was too weak for the stated six-tool objective.

## 실패 시 fallback

Allow `required_tool_ids` override in payload while defaulting to all six named tools.

## 실제 사용 결과

All regression and sanity gates passed.

## 다음 재사용 규칙

Any operating completion path should inspect `tool_coverage_complete` before claiming readiness.
