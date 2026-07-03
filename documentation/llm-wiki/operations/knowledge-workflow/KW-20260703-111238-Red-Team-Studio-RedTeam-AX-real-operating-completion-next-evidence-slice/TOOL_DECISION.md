---
type: tool_decision
status: final
project: Red Team Studio
task: RedTeam AX real operating completion next evidence slice
created: 2026-07-03T11:12:38+09:00
---

# Tool Decision

## 작업 목표

전체 RedTeam AX goal 완료 여부를 현재 audit/gate 산출물로 기계 검토하고, 미완료 조건을 API/UI에서 차단한다.

## 필요한 능력

코드 검색, API 추가, React store 메서드 추가, regression/sanity/accepted gate 검증.

## 후보 도구 비교

| 도구 | 장점 | 단점 | 기존 도구와 결합 | 판정 |
|---|---|---|---|---|
| `rg` | 빠른 위치 검색 | 편집 불가 | file reads | 선택 |
| `apply_patch` | 국소 수정 명확 | 대량 문서엔 반복 필요 | git diff | 선택 |
| pytest | API 회귀 검증 | capture hang 가능 | file-backed logs | 선택 |
| node check | JS 문법 검증 | UI 동작은 제한적 | frontend sanity | 선택 |
| accepted gate | 전체 회귀 증거 | 오래 걸림 | file-backed logs | 선택 |

## 선택한 도구 또는 도구 체인

`rg` -> `apply_patch` -> py_compile/node/pytest/sanity -> accepted gate -> KW/handoff/git.

## 선택 이유

목표 완료 판정은 기존 artifact를 읽는 read-only API와 UI가 가장 직접적이다.

## 버린 대안과 이유

Thread goal을 API에서 직접 완료 처리하는 방식은 모든 외부 증거가 충족되기 전 과장 위험이 있어 제외했다.

## 실패 시 fallback

pytest capture hang은 stdout/stderr file redirection으로 우회한다.

## 실제 사용 결과

API/UI/docs/tests가 갱신됐고 accepted gate 26/26이 통과했다.

## 다음 재사용 규칙

완료 판정 기능은 항상 `does_not_mark_goal_complete=true`로 먼저 증거화하고, 실제 goal status 변경은 별도 최종 감사 후에만 수행한다.
