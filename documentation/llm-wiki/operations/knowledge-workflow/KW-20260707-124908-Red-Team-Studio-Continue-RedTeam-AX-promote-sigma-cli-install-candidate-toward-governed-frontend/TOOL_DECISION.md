---
type: tool_decision
status: draft
project: Red Team Studio
task: Continue RedTeam AX promote sigma-cli install candidate toward governed frontend execution
created: 2026-07-07T12:49:08+09:00
---

# Tool Decision

## Decision

Promote Sigma CLI as an optional low-risk ToolProfile and runner preset, not as a required six-tool completion gate member.

## Rationale

Sigma CLI validates local detection rules and does not perform scanning, exploitation, endpoint collection, or cloud changes. It can therefore move the platform toward priority 2 frontend button execution while preserving RedTeam AX guardrails.

## Tooling Notes

`sigma-cli 3.0.3` was installed in the project `.venv`. The install succeeded, but `pip check` reports dependency conflicts. This must be handled before production packaging.

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
