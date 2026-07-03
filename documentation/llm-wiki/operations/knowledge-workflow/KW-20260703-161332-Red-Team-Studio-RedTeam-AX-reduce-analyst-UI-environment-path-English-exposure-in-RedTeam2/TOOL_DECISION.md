---
type: tool_decision
status: complete
project: Red Team Studio
task: RedTeam AX reduce analyst UI environment path English exposure in RedTeam2
created: 2026-07-03T16:13:32+09:00
---

# Tool Decision

## 작업 목표

RedTeam2 analyst UI에서 raw path/API/environment clutter를 줄이고 sanity 계약을 갱신한다.

## 필요한 능력

빠른 문자열 검색, 좁은 frontend patch, 문서/audit 갱신, sanity 검증.

## 후보 도구 비교

| 도구 | 장점 | 단점 | 기존 도구와 결합 | 판정 |
|---|---|---|---|---|
| `rg` | 빠른 노출 문자열 검색 | 구조 이해는 별도 필요 | `Get-Content` chunk read | 선택 |
| `apply_patch` | 변경 범위 명확 | 큰 JSON 자동 생성에는 불편 | git diff 검토 | 선택 |
| `node --check` | JS 문법 즉시 검증 | UI 시각 검증 아님 | sanity tests | 선택 |
| Python sanity | 프로젝트 계약 검증 | browser 렌더링 아님 | audit matrix | 선택 |
| Playwright | 실제 화면 확인 | 이번 slice 범위 대비 시간 큼 | 후속 visual regression | 보류 |

## 선택한 도구 또는 도구 체인

`rg` -> `apply_patch` -> `node --check` -> Python sanity -> git diff.

## 선택 이유

요구사항은 표시 문자열 정리와 정적 계약 갱신이므로 브라우저 자동화 전 정적 검증을 먼저 닫는 것이 효율적이다.

## 버린 대안과 이유

Backend schema 변경은 traceability를 깨므로 제외했다.

## 실패 시 fallback

문자열 sanity 실패 시 old anchor를 새 UX anchor로 교체하고 다시 실행한다.

## 실제 사용 결과

모든 정적 검증이 통과했다.

## 다음 재사용 규칙

RedTeam2 UI copy 변경 시 Korean inventory와 launch readiness contract를 함께 갱신한다.
