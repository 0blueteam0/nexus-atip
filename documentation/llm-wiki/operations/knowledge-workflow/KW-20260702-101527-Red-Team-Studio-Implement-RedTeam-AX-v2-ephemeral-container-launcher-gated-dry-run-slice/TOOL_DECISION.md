---
type: tool_decision
status: draft
project: Red-Team-Studio
task: Implement RedTeam AX v2 ephemeral container launcher gated dry-run slice
created: 2026-07-02T10:15:27+09:00
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

- `rg`: targeted inspection of runner/isolation code and plan/SPEC gaps.
- `apply_patch`: scoped source edits.
- `unittest`: API regression and sample E2E verification.
- `node --check`: JavaScript syntax validation.
- `npm.cmd run build`: production frontend build validation.

Execution boundary:
- The new test uses `REDTEAM_AX_CONTAINER_RUNNER_DRY_RUN=1`.
- No Docker/Podman process is invoked during readiness checks or dry-run verification.
- Real container execution remains behind issued token, attestation, runtime availability, and no dry-run flag.
