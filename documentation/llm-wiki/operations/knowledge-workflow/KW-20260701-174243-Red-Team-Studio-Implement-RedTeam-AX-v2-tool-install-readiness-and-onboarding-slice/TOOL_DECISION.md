---
type: tool_decision
status: draft
project: Red-Team-Studio
task: Implement RedTeam AX v2 tool install readiness and onboarding slice
created: 2026-07-01T17:42:43+09:00
---

# Tool Decision

## Filled Record

Selected tools: `rg` and UTF-8 file reads for inspection, `apply_patch` for edits, Python unittest for API/sample verification, `node --check` and Vite build for frontend validation, and knowledge workflow close for evidence gating.

Rejected tool behavior: the API does not run package managers, installers, Docker pulls, version commands, or scanner commands in this slice. It only publishes operator-run install and verification plans.

Rationale: the user goal requires install/link/use readiness for analysis tools, but RedTeam AX guardrails require install execution to remain explicit, reviewable, and separate from automated scanner execution.

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

