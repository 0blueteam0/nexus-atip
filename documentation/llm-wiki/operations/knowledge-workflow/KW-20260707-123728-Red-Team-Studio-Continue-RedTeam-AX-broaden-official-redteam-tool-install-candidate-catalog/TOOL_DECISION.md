---
type: tool_decision
status: draft
project: Red Team Studio
task: Continue RedTeam AX broaden official redteam tool install candidate catalog
created: 2026-07-07T12:37:28+09:00
---

# Tool Decision

## Decision

Use official documentation and official repositories as the basis for candidate install metadata. Treat all candidates as onboarding records, not trusted executable instructions.

## Tools Used

- `rg` for focused SPEC/repository inspection.
- Web search for official/current tool sources.
- `apply_patch` for scoped edits.
- Python compile and pytest for backend verification.
- Node syntax check and frontend sanity scripts for UI contract verification.
- `git diff --check` for whitespace validation.

## Reasoning

The user's priority is broad redteam tool discovery and installation-related progress, but RedTeam AX prohibits unapproved high-risk execution. A candidate catalog advances install/onboarding while preserving ROE/HITL/guardrail boundaries.

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
