---
type: tool_decision
status: recorded
project: Red-Team-Studio
task: RedTeam AX operating closure submission package and approver readiness slice
created: 2026-07-03T01:56:07+09:00
---

# Tool Decision

## 작업 목표

RedTeam AX v2 운영 closure 전 제출 패키지를 만들어 `source_dir`, 승인자 4명, runtime blocker, close-operating payload를 검증하고, scanner 명령 실행 없이 UI와 API에서 호출 가능하게 한다.

## 필요한 능력

- FastAPI route/model contract 추가
- React report store method와 Korean UI copy 추가
- Persistent archive state를 고려한 pytest regression
- Completion audit/LLM Wiki/plan 문서 갱신
- Knowledge Workflow close gate와 accepted gate 검증

## 후보 도구 비교

| 도구 | 장점 | 단점 | 기존 도구와 결합 | 판정 |
|---|---|---|---|---|
| `apply_patch` | diff가 명확하고 범위가 좁음 | 큰 템플릿 mismatch 시 재시도 필요 | git diff와 결합 | 선택 |
| `pytest` | backend behavior와 regression 증명 | archive 상태에 민감 | unique IDs로 보완 | 선택 |
| `node --check` | 빠른 JS syntax gate | runtime 렌더링은 보지 않음 | copy sanity와 결합 | 선택 |
| accepted gate script | 사용자 완료 조건에 가까운 통합 게이트 | 실행 시간이 있음 | pytest/sanity 이후 실행 | 선택 |
| raw shell rewrite | 빠름 | 수동 편집 추적이 약함 | 사용하지 않음 | 제외 |

## 선택한 도구 또는 도구 체인

`apply_patch` -> compile/syntax -> focused pytest -> full router pytest -> sanity scripts -> accepted gate -> knowledge workflow close -> handoff -> exact git staging.

## 선택 이유

이번 slice는 보안/승인 workflow를 다루므로 기능 추가와 증거 업데이트가 함께 필요하다. 각 게이트를 분리하면 scanner 실행 없이 package preparation만 구현됐음을 명확히 증명할 수 있다.

## 버린 대안과 이유

- Final close API에 옵션을 추가하는 방식: 고위험 closure와 준비 검증이 섞여 HITL 경계가 흐려진다.
- 실제 scanner live run 재실행: 이번 endpoint 목적은 기존 operator artifact 검증이며 실행 자체가 아니다.
- 광범위 UI refactor: 사용자 요청 slice보다 변경 범위가 커진다.

## 실패 시 fallback

router suite 또는 accepted gate 실패 시 staged 작업을 진행하지 않고 해당 실패만 보정한다. 실제 external scanner 상태가 blocker인 경우 package에는 blocker로 표시하고 final close는 보류한다.

## 실제 사용 결과

API/UI/test/doc 업데이트 후 compile, syntax, focused regression, full router regression, copy/plan/audit sanity, accepted gate가 통과했다.

## 다음 재사용 규칙

운영 closure와 보고서 export 전에는 먼저 non-executing submission package를 만들고, 사람이 approver fields, runtime blockers, payload를 확인한 뒤 final close를 호출한다.