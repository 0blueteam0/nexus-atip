---
type: tool_decision
status: draft
project: Red Team Studio
task: RedTeam AX external scanner readiness and real tool execution closure continuation
created: 2026-07-03T12:41:40+09:00
---

# Tool Decision

## 작업 목표

Improve OpenVAS/ZAP readiness by preventing unsafe endpoint refs before live import.

## 필요한 능력

Read existing API model, edit validation logic, run focused tests, and preserve completion blockers.

## 후보 도구 비교

| 도구 | 장점 | 단점 | 기존 도구와 결합 | 판정 |
|---|---|---|---|---|
| 후보 1 |  |  |  |  |
| API model edit | Directly enforces the contract | Requires regression update | Reuses existing v2 API | selected |
| New standalone checker | Easy to isolate | Would not protect API authorization | Could duplicate sanity script | rejected |
| Frontend-only copy | Improves guidance | Does not enforce safety | Needs backend truth | rejected |

## 선택한 도구 또는 도구 체인

Existing API model plus targeted pytest and existing external scanner sanity scripts.

## 선택 이유

The endpoint/vault setup error must be rejected by the backend before service import.

## 버린 대안과 이유

Did not create a fake endpoint or mock live import because that would not move the real goal toward organization endpoint readiness.

## 실패 시 fallback

If diagnostics are too strict for an approved endpoint, adjust allowed read-only path terms with a regression covering the approved case.

## 실제 사용 결과

Targeted tests passed and external readiness/import smokes still honestly report missing endpoint/vault blockers.

## 다음 재사용 규칙

All future OpenVAS/ZAP endpoint setup changes should assert `endpoint_ref_diagnostics` and no secret material storage.
