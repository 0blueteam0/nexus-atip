---
type: tool_decision
status: draft
project: Red-Team-Studio
task: Continue RedTeam AX goal: simplify RedTeam2 analyst UI and advance authorized multi-tool execution integration
created: 2026-07-03T16:38:34+09:00
---

# Tool Decision

## 작업 목표

RedTeam2 복합 도구 영역을 실행 나열형 UI에서 분석 결과 수집·검토 워크플로우로 전환하고, backend collect-results에 분석가용 요약 projection을 추가한다.

## 필요한 능력

- repository text search
- scoped code edit
- Python/JavaScript syntax validation
- existing sanity contract update
- knowledge workflow evidence close

## 후보 도구 비교

| 도구 | 장점 | 단점 | 기존 도구와 결합 | 판정 |
|---|---|---|---|---|
| rg | 빠른 문구/코드 위치 탐색 | 구조 수정은 불가 | apply_patch 전 범위 확인 | 선택 |
| apply_patch | 작은 수동 변경 추적 가능 | 대량 JSON 변환에는 부적합 | 문서/코드 scoped edit | 선택 |
| python json | JSON 감사 매트릭스 구조 보존 | 임의 파일 편집에는 부적합 | completion audit item append | 선택 |
| node --check | JS syntax 확인 | runtime/visual 검증 아님 | frontend sanity와 결합 | 선택 |
| browser test | 실제 화면 확인 가능 | 현재 slice에서 아직 미실행 | 후속 검증 필요 | 보류 |

## 선택한 도구 또는 도구 체인

`rg` -> `apply_patch` -> `python json` -> syntax/sanity tests -> knowledge workflow close -> git stage/commit/push.

## 선택 이유

기존 구현을 보존하면서 RedTeam2 UI copy와 backend response projection만 좁게 바꾸는 작업이므로 광범위 생성보다 scoped edit가 적합하다.

## 버린 대안과 이유

- UI 전체 재작성: 현재 목표에는 과하고 기존 승인/증거 workflow를 깨뜨릴 위험이 있다.
- runner 기능 제거: 사용자는 실제 설치 도구 실행도 요구하므로 기능 제거는 목표와 맞지 않는다.

## 실패 시 fallback

sanity 실패 시 요구 anchor를 실제 UI 문구에 맞춰 조정하고, browser visual regression은 후속 slice로 분리한다.

## 실제 사용 결과

pending: sanity tests and close gate.

## 다음 재사용 규칙

분석가용 RedTeam2 copy 변경은 Korean copy inventory와 frontend runtime readiness contract를 함께 갱신한다.
