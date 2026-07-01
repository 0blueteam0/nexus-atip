---
type: tool_decision
status: draft
project: Red-Team-Studio
task: Implement RedTeam AX v2 pixel-level visual redaction artifact slice
created: 2026-07-01T16:51:58+09:00
---

# Tool Decision

| decision | selected tool | rationale | alternative |
|---|---|---|---|
| Repository discovery | `rg`, scoped `Get-Content` | Locate exact SPEC, backend, frontend, and tests quickly. | broad inventory |
| Image processing | Pillow (`PIL`) | Already available in `.venv`; sufficient for deterministic PNG decode/save/draw. | OpenCV/numpy or adding new dependency |
| File edits | `apply_patch` | Precise scoped changes with dirty worktree safety. | shell generated rewrites |
| Verification | unittest, Vite build, plan sanity | Existing project contracts for backend, frontend, and plan. | manual check only |

No scanner or high-risk redteam execution was performed.

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

