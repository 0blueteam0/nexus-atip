---
type: tool_decision
status: complete
project: Red Team Studio
task: RedTeam AX real tool operating evidence continuation
created: 2026-07-03T11:36:25+09:00
---

# Tool Decision

## 작업 목표

Reduce the RTA-COMP-015 runtime evidence gap by proving real governed Docker container execution if the current environment allows it.

## 필요한 능력

- Inspect live Docker/WSL readiness.
- Execute existing RedTeam AX sanity harnesses.
- Modify launcher code and regression tests.
- Preserve evidence without treating smoke output as final operating report evidence.

## 후보 도구 비교

| 도구 | 장점 | 단점 | 기존 도구와 결합 | 판정 |
|---|---|---|---|---|
| Docker CLI | Direct runtime truth | Can run containers | Used only for version/image/safe smoke | selected |
| RedTeam AX sanity scripts | Repo-native artifacts | Some scripts require venv | Used for container, WSL, promotion, gates | selected |
| pytest | Regression coverage | Does not prove real runtime alone | Verifies launcher contract | selected |
| goal-completion-review API | Confirms non-completion | Does not fix blockers | Used as final blocker check | selected |
| Manual shell probing | Fast diagnosis | Not canonical evidence | Used only to isolate ENTRYPOINT issue | limited |

## 선택한 도구 또는 도구 체인

Docker CLI -> RedTeam AX container smoke -> code/test fix -> WSL readiness -> strict promotion -> accepted gate manifest -> byproduct review -> goal completion review.

## 선택 이유

This keeps evidence in existing RedTeam AX artifact formats and uses the project venv that already powers accepted gates.

## 버린 대안과 이유

- Marking RTA-COMP-015 proved: rejected because WSL and external scanner endpoint gates remain blocked.
- Pulling new images or running active scanner commands: rejected because the objective requires approved, governed, low-risk execution and no unapproved high-risk activity.

## 실패 시 fallback

If Docker smoke failed after launcher fix, preserve the blocker artifact and continue with remediation runbook. Docker passed, so fallback was not needed.

## 실제 사용 결과

Docker container runtime smoke passed. WSL and external scanner readiness remain blocked. Accepted gates passed 26/26. Goal completion review remains blocked by 1 unresolved item and 4 remaining gaps.

## 다음 재사용 규칙

Use `.venv\Scripts\python.exe` for RedTeam AX harnesses. Keep ENTRYPOINT clearing for container runner executions unless a future reviewed container policy explicitly overrides it.
