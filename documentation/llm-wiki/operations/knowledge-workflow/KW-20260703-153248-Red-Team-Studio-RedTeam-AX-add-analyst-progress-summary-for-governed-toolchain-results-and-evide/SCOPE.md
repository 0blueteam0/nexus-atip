---
type: scope
task_id: KW-20260703-153248-Red-Team-Studio-RedTeam-AX-add-analyst-progress-summary-for-governed-toolchain-results-and-evide
project: Red Team Studio
task: RedTeam AX add analyst progress summary for governed toolchain results and evidence next steps
created: 2026-07-03T15:32:48+09:00
enforcement_level: L2-or-higher
---

# Scope

## User Intent

RedTeam AX에서 프론트엔드로 실행하거나 첨부한 도구 결과가 Evidence/Finding/Report workflow 중 어디까지 진행됐는지 초급 분석가가 바로 확인할 수 있게 한다.

## Included

- `/api/redteam/v2/toolchains/{toolchain_id}/run-status` 응답에 분석가용 진행 요약 추가
- `/api/redteam/v2/toolchains/{toolchain_id}/collect-results` 응답에 같은 진행 요약 추가
- RedTeam2 보고서 스튜디오의 복합 도구 실행 영역에 `분석가 진행 요약`과 `진행 단계` 표 추가
- API regression, frontend contract sanity, audit matrix sanity, JSON validity 검증
- FINAL_PLAN, Detailed_PLAN, LLM Wiki, completion audit 문서 갱신

## Excluded

- 실제 OpenVAS/ZAP service import 수행
- 실제 Nuclei/OpenVAS/Trivy/SCA/npm audit/ZAP 산출물 전체 운영 제출
- Evidence 승인, Finding promotion, severity two-person approval, Matrix/report/export/completion gate 최종 완료

## Work Units

| unit | description | expected_artifact |
|---|---|---|
| API contract | toolchain run-status/collect-results에 `analyst_progress_summary` 추가 | `runtime/redteam_v2_models.py` |
| UI rendering | RedTeam2에 분석가용 진행 요약/단계 표 추가 | `reports.js` |
| Regression | 진행 요약 필드와 completion gate 차단 회귀 검증 | `tests/test_redteam_v2_api_router.py` |
| Documentation | 계획, Wiki, audit matrix 갱신 | `FINAL_PLAN.md`, `Detailed_PLAN.MD`, `LLM_WIKI_HOME.md`, completion audit files |

## Verification Criteria

| criterion | evidence_required |
|---|---|
| API returns analyst progress summary | targeted API tests pass |
| UI contract contains Korean progress labels | frontend sanity tests pass |
| Audit matrix remains valid | JSON tool and audit sanity pass |
| Completion is not falsely closed | completion review blocker regression passes |

## Completion Definition

This slice is complete when the progress-summary contract is implemented, rendered, documented, tested, and pushed. The overall `/goal` remains incomplete until real operating scanner outputs are approved through Evidence/Finding/Report/export/completion gates.
