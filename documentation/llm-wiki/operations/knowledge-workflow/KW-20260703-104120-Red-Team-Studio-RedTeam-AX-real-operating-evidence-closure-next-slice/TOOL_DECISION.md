---
type: tool_decision
status: final
project: Red Team Studio
task: RedTeam AX real operating evidence closure next slice
created: 2026-07-03T10:41:20+09:00
---

# Tool Decision

## 작업 목표

운영 closure 제출 패키지에서 개발 부산물 source가 실제 완료 증거로 승격되지 않도록 코드, UI, audit, tests를 갱신한다.

## 필요한 능력

코드 검색, 국소 패치, Python/JS sanity, API regression, accepted gate manifest, knowledge workflow 기록.

## 후보 도구 비교

| 도구 | 장점 | 단점 | 기존 도구와 결합 | 판정 |
|---|---|---|---|---|
| `rg` | 빠른 위치 검색 | 구조 편집 불가 | PowerShell read와 결합 | 선택 |
| `apply_patch` | 국소 변경 추적 명확 | 대량 생성에는 번거로움 | git diff 확인과 결합 | 선택 |
| pytest | API 회귀 검증 | 느릴 수 있음 | accepted gate와 결합 | 선택 |
| node `--check` | JS 문법 빠른 검증 | runtime UI는 보장 안 함 | frontend sanity와 결합 | 선택 |
| accepted gate manifest | 전체 slice gate 증거 | subprocess capture 이슈 발생 | file-backed log로 보완 | 선택 |

## 선택한 도구 또는 도구 체인

`rg` -> targeted file reads -> `apply_patch` -> pytest/node/sanity -> accepted gate manifest -> KW close -> handoff/git.

## 선택 이유

이번 작업은 대규모 재작성보다 완료 증거 boundary의 정확한 계약 보강이 핵심이다.

## 버린 대안과 이유

UI에 `require_real_completion_evidence` raw key를 노출하는 방식은 초급자-facing Korean UI를 기술 키로 오염시켜 제외했다. sanity는 source-level 검사로 분리했다.

## 실패 시 fallback

accepted gate pipe timeout은 file-backed stdout/stderr log로 전환했다.

## 실제 사용 결과

API/UI/docs/audit/test 변경이 완료됐고 accepted gate 26/26이 통과했다.

## 다음 재사용 규칙

Windows에서 장시간 pytest를 subprocess로 실행하는 gate runner는 pipe capture 대신 file-backed log capture를 우선 사용한다.
