---
type: tool_decision
status: updated
project: Red Team Studio
task: RedTeam AX container runtime and remaining live execution evidence slice
created: 2026-07-02T17:05:24+09:00
---

# Tool Decision

## 작업 목표

Represent remaining runtime blockers with executable, machine-readable readiness artifacts that the backend and frontend can consume without running high-risk actions from the status API.

## 필요한 능력

- Local runtime probe without active scanning.
- Artifact persistence.
- Backend read-only projection.
- Korean frontend visibility.
- Regression gate integration.

## 후보 도구 비교

| 도구 | 장점 | 단점 | 기존 도구와 결합 | 판정 |
|---|---|---|---|---|
| Docker real smoke | Directly proves target runtime | Docker daemon is currently unavailable | Existing container smoke | Keep as future required gate |
| Podman smoke | Docker alternative | Executable unavailable | Could reuse container smoke pattern | Not usable now |
| WSL readiness probe | Captures local Linux runtime blocker safely | Does not prove container runtime success | New artifact projected by runtime readiness API | Selected |
| Manual note only | Fast | Not machine-checkable | Weak evidence | Rejected |
| Active scanner probe | Proves more | Risk and approvals not present | Outside this slice | Rejected |

## 선택한 도구 또는 도구 체인

`redteam_ax_wsl_runtime_readiness.py` plus `/api/redteam/v2/runtime-readiness`, RedTeam2 panel, pytest/contracts, and accepted gate manifest.

## 선택 이유

The WSL checker gives a low-risk, repeatable readiness artifact. It records command outputs, blockers, safety flags, and exits 0 by default so accepted gates can preserve current blocker state without falsely failing the whole regression suite.

## 버린 대안과 이유

Docker real run is still required later, but running it now cannot pass because Docker Desktop reports daemon startup failure. Active scanner checks were excluded because this slice is only runtime readiness visibility and evidence.

## 실패 시 fallback

If WSL is unavailable, the checker records `blocked_wsl_executable_not_found` or `blocked_wsl_list_failed` and the runtime readiness API exposes that as a blocker.

## 실제 사용 결과

Current artifact status is `blocked_wsl_distribution_start_failed` for `Ubuntu-22.04`.

## 다음 재사용 규칙

Use `--require-ready` only in an environment where WSL repair has been performed and a non-zero exit should fail deployment/readiness promotion.
