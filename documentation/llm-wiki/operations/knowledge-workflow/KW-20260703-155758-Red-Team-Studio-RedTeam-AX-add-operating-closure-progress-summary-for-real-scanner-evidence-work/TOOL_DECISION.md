---
type: tool_decision
status: draft
project: Red Team Studio
task: RedTeam AX add operating closure progress summary for real scanner evidence workflow
created: 2026-07-03T15:57:58+09:00
---

# Tool Decision

## 작업 목표

운영 closure API/UI에 공통 진행 요약을 추가하고 테스트/문서/감사 매트릭스로 계약을 고정한다.

## 필요한 능력

코드 위치 탐색, 제한된 patch 적용, Python/JS sanity, API regression, completion audit 문서 갱신.

## 후보 도구 비교

| 도구 | 장점 | 단점 | 기존 도구와 결합 | 판정 |
|---|---|---|---|---|
| `rg` | 빠른 위치 탐색 | 파일 내용 전체 이해는 별도 read 필요 | `Get-Content`와 결합 | 선택 |
| `apply_patch` | 변경 범위가 명확하고 감사 가능 | 큰 파일 patch는 문맥 실패 가능 | 작은 patch로 분할 | 선택 |
| `.venv` Python tests | 기존 API regression 재사용 | 전체 suite는 비용 큼 | targeted tests와 sanity 조합 | 선택 |
| Node `--check` | frontend syntax 빠른 검증 | 런타임 렌더 검증은 아님 | frontend contract sanity와 결합 | 선택 |
| 수동 브라우저 검증 | 화면 확인 가능 | 이번 slice는 계약 검증으로 충분 | 후속 실제 E2E에 사용 | 보류 |

## 선택한 도구 또는 도구 체인

`rg` -> `Get-Content -Encoding UTF8` -> `apply_patch` -> py_compile/node check -> targeted API tests -> frontend/completion sanity.

## 선택 이유

요구가 기존 API/UI 계약 확장이므로 빠른 정적 탐색과 제한 patch, 기존 regression이 가장 직접적이다.

## 버린 대안과 이유

새 endpoint 추가는 UI가 다시 여러 source를 호출해야 하므로 중복이 늘어난다. 브라우저 수동 검증은 실제 server 상태가 필요하고 이번 변경은 contract test로 충분히 고정된다.

## 실패 시 fallback

문맥 patch가 실패하면 더 작은 근접 문맥으로 나눠 적용한다. API regression이 실패하면 progress summary 상태 라우팅을 기존 응답 flag 기준으로 조정한다.

## 실제 사용 결과

문법/contract/API/sanity 검증이 exit_code 0으로 통과했다.

## 다음 재사용 규칙

closure 단계가 늘어나면 새 API 응답에도 `operating_closure_progress_summary`를 붙이고 RedTeam2는 최신 결과 우선순위만 갱신한다.
