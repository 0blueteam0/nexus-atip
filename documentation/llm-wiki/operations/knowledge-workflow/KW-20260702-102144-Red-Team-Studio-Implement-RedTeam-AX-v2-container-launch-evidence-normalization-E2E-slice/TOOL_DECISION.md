---
type: tool_decision
status: draft
project: Red-Team-Studio
task: Implement RedTeam AX v2 container launch evidence normalization E2E slice
created: 2026-07-02T10:21:44+09:00
---

# Tool Decision

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

# Tool Decision

- `rg`: located existing parser/evidence paths.
- `apply_patch`: scoped edits.
- `unittest`: backend regression and sample E2E.
- `node --check`: frontend syntax guard.
- `npm.cmd run build`: frontend build guard.

No Docker/Podman, scanner, package manager, or network scan command was executed.
