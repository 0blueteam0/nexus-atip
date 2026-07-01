---
type: tool_decision
status: draft
project: Red-Team-Studio
task: Implement RedTeam AX v2 approved tool runner backend preflight slice
created: 2026-07-01T17:32:09+09:00
---

# Tool Decision

## Filled Record

Selected tools:
- `rg` and targeted UTF-8 file reads for specs/source inspection.
- `apply_patch` for scoped Python, JavaScript, plan, and session edits.
- Python unittest for API and sample E2E verification.
- `node --check` and `npm.cmd run build` for frontend verification.
- `knowledge_workflow.py close` for evidence gate enforcement.

Deferred: no real scanner/network execution was run. The only actual subprocess test path uses `npm.cmd --version` after dry-run/sandbox token and wrapper trust gates. Container/namespace/resource isolation is deferred to a later slice.

Rationale: the user goal requires tool execution capability, but RedTeam AX safety requires execution to remain subordinate to ROE/HITL/guardrail and wrapper trust controls.

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

