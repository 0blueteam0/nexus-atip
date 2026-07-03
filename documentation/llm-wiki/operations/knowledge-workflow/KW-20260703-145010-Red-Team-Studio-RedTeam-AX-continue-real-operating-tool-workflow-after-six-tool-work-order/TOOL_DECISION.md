---
type: tool_decision
status: complete
project: Red-Team-Studio
task: RedTeam AX continue real operating tool workflow after six-tool work order
created: 2026-07-03T14:50:10+09:00
---

# Tool Decision

## 작업 목표

RedTeam2 화면의 분석가용 흐름을 단순화하고, 환경 준비도 세부 정보는 관리자용으로 분리하며, 6개 도구 산출물 제출 양식을 생성하는 API/UI를 추가한다.

## 필요한 능력

- Python/FastAPI 라우터와 모델 함수 변경
- React store/render 함수 변경
- Korean copy contract sanity 유지
- Evidence workflow 기록과 git 반영

## 후보 도구 비교

| 도구 | 장점 | 단점 | 기존 도구와 결합 | 판정 |
|---|---|---|---|---|
| apply_patch | 변경 범위가 명확하고 diff 추적 가능 | 대량 문서 편집은 장황함 | git diff와 결합 | 선택 |
| rg | 빠른 위치 확인 | 파일 수정 불가 | 테스트 실패 위치 추적 | 선택 |
| py_compile/node --check | 빠른 문법 검증 | 동작 검증은 아님 | unittest와 결합 | 선택 |
| unittest/sanity scripts | 기존 계약 검증 | 시간이 더 걸림 | API/UI 계약 확인 | 선택 |
| 실제 scanner 실행 | 실측 가능 | 현재 승인/환경/ROE 조건 미충족 | 제외 | 제외 |

## 선택한 도구 또는 도구 체인

`rg`로 위치 확인, `apply_patch`로 변경, `py_compile`, `node --check`, `unittest`, sanity scripts, goal-completion-review로 검증했다.

## 선택 이유

요청은 안전한 계획/증거화/제출 양식 개선이며 실제 고위험 도구 실행이 아니다. 따라서 코드는 좁게 수정하고 기존 계약 테스트로 회귀를 확인하는 흐름이 맞다.

## 버린 대안과 이유

- 웹앱에서 6개 도구 직접 실행: 승인 없는 고위험 실행 가능성이 있어 제외.
- 환경 준비도 정보를 완전히 제거: 운영 담당자에게 필요한 설정 정보가 사라져 제외.
- 새로운 독립 UI 페이지 생성: 기존 RedTeam2 복제/확장 요구와 다르고 변경 범위가 커 제외.

## 실패 시 fallback

테스트 실패 시 API payload 계약과 sanity anchor를 우선 맞춘다. 실제 실측 증거는 운영자가 제출할 때까지 goal-completion-review blocked 상태를 유지한다.

## 실제 사용 결과

6개 도구 제출 양식 API와 RedTeam2 버튼/테이블이 추가됐고, 분석가용 실행 안내와 관리자용 환경 설정 정보가 분리됐다.

## 다음 재사용 규칙

RedTeam2에서 운영자가 실제 도구 산출물을 제출할 때는 `/api/redteam/v2/toolchains/six-tool-submission-template`로 attachment JSON을 만든 뒤 `/api/redteam/v2/toolchains/operator-evidence-submission-manifest-draft`로 검증한다.
