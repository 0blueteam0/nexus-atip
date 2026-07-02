---
type: tool_decision
status: complete
project: Red Team Studio
task: RedTeam AX next operating evidence closure slice
created: 2026-07-03T03:32:30+09:00
updated: 2026-07-03T04:24:00+09:00
---

# Tool Decision

## 작업 목표

승인된 operator evidence card 후보를 RedTeam AX Evidence Card로 등록하고 명시적 사람 검토 승인 기록까지 연결하는 다음 구현 slice를 완료한다.

## 필요한 능력

코드 탐색, 좁은 파일 수정, API 테스트, 프론트 copy/runtime 계약 검증, knowledge workflow와 Git push.

## 후보 도구 비교

| 도구 | 장점 | 단점 | 기존 도구와 결합 | 판정 |
|---|---|---|---|---|
| `rg` | 빠른 위치 확인 | 구조 수정 불가 | pytest 전후 탐색 | 사용 |
| `apply_patch` | 변경 범위가 명확함 | 대량 재작성에는 부적합 | 코드/문서의 좁은 수정 | 사용 |
| pytest | API 회귀 검증 | 프론트 런타임 렌더링은 별도 필요 | TestClient 기반 안전 검증 | 사용 |
| `node --check` | JS 구문 확인이 빠름 | 동작 검증은 아님 | React store 구문 확인 | 사용 |
| sanity scripts | 프로젝트별 계약 검증 | 실제 운영 완료를 대체하지 않음 | accepted gate와 결합 | 사용 |

## 선택한 도구 또는 도구 체인

`rg` -> `apply_patch` -> focused pytest -> full pytest -> `node --check` -> sanity scripts -> accepted gate manifest -> knowledge workflow close -> handoff -> git commit/push.

## 선택 이유

사용자 목표는 대규모 개편 계획의 연속 구현이지만, 이번 slice는 명확한 API/UI/테스트 단위로 닫을 수 있었다.

## 버린 대안과 이유

실제 스캐너 실행과 자동 Finding 생성은 제외했다. 승인된 실제 operator artifact가 아직 부족하고, AI가 고위험 실행을 대신 수행하면 목표의 HITL 원칙에 어긋난다.

## 실패 시 fallback

API 테스트 실패 시 모델 함수를 원복하지 않고 승인/생성 분기만 축소 수정한다. accepted gate 실패 시 해당 gate artifact와 실패 파일을 먼저 확인한다.

## 실제 사용 결과

API/UI/문서/감사 매트릭스가 갱신되었고 focused/full/sanity/accepted gate 검증이 통과했다.

## 다음 재사용 규칙

운영 증거를 Finding/Matrix/report로 승격하는 후속 slice도 기본 상태는 pending으로 두고, 명시적 사람 검토와 actor context를 승인 조건으로 유지한다.
