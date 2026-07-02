---
type: tool_decision
status: draft
project: Red Team Studio
task: RedTeam AX tool result agent automation next slice
created: 2026-07-03T04:00:39+09:00
---

# Tool Decision

## 작업 목표

RedTeam AX toolchain result collection이 도구별 LLM 분석 에이전트 판단과 Evidence 사용 제한을 API/UI/테스트/문서에 보존하게 만든다.

## 필요한 능력

- Python/FastAPI model flow inspection and regression testing.
- React store method UI patching and syntax validation.
- Korean copy/sanity contract maintenance.
- Evidence workflow documentation.

## 후보 도구 비교

| 도구 | 장점 | 단점 | 기존 도구와 결합 | 판정 |
|---|---|---|---|---|
| `rg` | 빠른 anchor 검색 | 의미 해석은 수동 필요 | Python snippets와 결합 | 선택 |
| `apply_patch` | 변경 범위가 명확함 | 큰 구조 생성에는 장황함 | git diff와 결합 | 선택 |
| `pytest` | API contract 회귀 검증 | 전체 환경 smoke는 아님 | accepted gate와 결합 | 선택 |
| `node --check` | JS syntax 빠른 검증 | 브라우저 렌더 검증은 아님 | frontend sanity와 결합 | 선택 |
| custom sanity scripts | 프로젝트 고유 완료 조건 검증 | 파일명/인코딩 주의 필요 | accepted gate manifest와 결합 | 선택 |

## 선택한 도구 또는 도구 체인

`rg` -> source snippets -> `apply_patch` -> focused pytest -> full router pytest -> compile/JS/sanity/accepted gate -> knowledge workflow close -> staged-only git.

## 선택 이유

요구사항이 기존 code path 보강이므로 새 도구보다 기존 regression/sanity contract가 더 정확하다.

## 버린 대안과 이유

- Browser automation: 이번 slice는 UI text/source contract 중심이라 빠른 sanity가 충분했다.
- New backend endpoint: 기존 collect-results API가 이미 정본 결과 회수 지점이다.

## 실패 시 fallback

Focused regression 실패 시 `collect_toolchain_results` payload shape를 축소하고 UI는 optional field only로 유지한다.

## 실제 사용 결과

Focused regression, full router regression, py_compile, node check, Korean copy inventory, runtime readiness contract, completion audit, plan contract, accepted gate manifest가 통과했다.

## 다음 재사용 규칙

도구 결과 관련 새 UI/Agent traceability는 collect-results 또는 Evidence approval lane에 붙이고, raw output은 항상 untrusted data로 표시한다.
