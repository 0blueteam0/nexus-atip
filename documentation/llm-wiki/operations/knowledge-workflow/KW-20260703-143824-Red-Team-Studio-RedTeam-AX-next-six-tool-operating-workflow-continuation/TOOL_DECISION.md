---
type: tool_decision
status: draft
project: Red-Team-Studio
task: RedTeam AX next six-tool operating workflow continuation
created: 2026-07-03T14:38:24+09:00
---

# Tool Decision

## 작업 목표
RedTeam AX v2의 필수 6개 분석도구 운영 순서를 API/UI로 안내하되 scanner 명령은 실행하지 않는다.

## 필요한 능력
코드베이스 탐색, FastAPI router/model 확장, React store method 수정, Python unittest, frontend sanity, completion audit 문서 갱신.

## 후보 도구 비교

| 도구 | 장점 | 단점 | 기존 도구와 결합 | 판정 |
|---|---|---|---|---|
| rg/Get-Content | 빠른 위치 탐색 | 구조 변경은 못함 | 코드/문서 위치 확인 | 선택 |
| apply_patch | 변경 범위가 명확함 | 대량 JSON은 주의 필요 | 수동 소스/문서 편집 | 선택 |
| unittest/TestClient | API 계약 회귀 확인 | 브라우저 실제 렌더링은 아님 | 기존 router test suite | 선택 |
| node --check | JS 구문 오류 확인 | UI 동작 전체 검증은 아님 | frontend sanity와 결합 | 선택 |
| 실제 scanner 실행 | 실측성 높음 | ROE/HITL/endpoint 준비 전 위험 | 이번 범위와 불일치 | 제외 |

## 선택한 도구 또는 도구 체인
`rg`/`Get-Content` -> `apply_patch` -> `py_compile` -> targeted/full unittest -> `node --check` -> frontend/document sanity -> goal-completion-review.

## 선택 이유
이번 변경은 실행 경로 자체가 아니라 안전한 안내/라우팅 계층이다. 기존 테스트 체인으로 side-effect-free 계약을 확인하는 것이 목적에 맞다.

## 버린 대안과 이유
실제 OpenVAS/ZAP/Nuclei/Trivy/npm audit 실행은 조직 endpoint/vault와 ROE/HITL 준비가 완료되지 않아 이번 slice에서 제외했다.

## 실패 시 fallback
API/UI 변경을 되돌리는 대신 work order를 문서 전용으로 축소하고 launch-readiness 표만 유지한다.

## 실제 사용 결과
API/UI/문서 변경 후 전체 router 83개 테스트와 frontend sanity가 통과했다. goal review는 계속 blocked로 유지됐다.

## 다음 재사용 규칙
새 RedTeam2 workflow 안내를 추가할 때는 실행 여부와 completion claim 여부를 별도 필드로 명시하고 completion audit matrix에 residual gap을 기록한다.
