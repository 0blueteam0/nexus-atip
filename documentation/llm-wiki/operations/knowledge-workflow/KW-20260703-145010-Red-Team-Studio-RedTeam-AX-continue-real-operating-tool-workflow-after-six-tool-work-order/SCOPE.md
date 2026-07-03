---
type: scope
task_id: KW-20260703-145010-Red-Team-Studio-RedTeam-AX-continue-real-operating-tool-workflow-after-six-tool-work-order
project: Red-Team-Studio
task: RedTeam AX continue real operating tool workflow after six-tool work order
created: 2026-07-03T14:50:10+09:00
enforcement_level: L2-or-higher
---

# Scope

## User Intent

사용자는 RedTeam AX 목표를 계속 수행하되, Report Studio의 RedTeam2 화면에서 분석가가 보는 실행 안내를 단순화하고 Docker/WSL/OpenVAS/ZAP endpoint/vault 같은 환경 설정 정보는 관리자용 영역으로 분리하라고 수정 요청했다. 또한 6개 필수 도구(Nuclei, OpenVAS, Trivy, SCA, npm audit, ZAP)의 운영 산출물을 웹앱이 직접 고위험 실행하지 않고 사람이 수행한 뒤 Evidence 제출 manifest로 넘길 수 있는 양식을 요구했다.

## Included

- RedTeam2 프론트 화면에서 `분석가용 다음 실행 안내`와 `분석 환경 설정(관리자용)` 분리.
- 6개 필수 도구 산출물 제출 양식 API 추가.
- 운영자 첨부 JSON을 기존 manifest 초안 API와 연결.
- FINAL_PLAN.md, Detailed_PLAN.MD, LLM Wiki, completion audit matrix 갱신.
- 라우터 테스트와 프론트 sanity 계약 테스트 갱신.

## Excluded

- 실제 Nuclei/OpenVAS/Trivy/SCA/npm audit/ZAP 실행.
- 승인 없는 active scan, shell expansion, secret 저장.
- 최종 목표 완료 선언. goal-completion-review가 아직 blocked이다.

## Work Units

| unit | description | expected_artifact |
|---|---|---|
| UI-RT2-ANALYST-GUIDE | 분석가용 5단계 실행 안내와 관리자용 환경 설정 분리 | reports.js |
| API-SIX-TOOL-SUBMISSION | 6개 도구 제출 template API와 모델 함수 | redteam_v2_models.py, redteam_v2_api_router.py |
| TESTS-SANITY | 라우터 테스트와 프론트 계약 테스트 | tests/test_redteam_v2_api_router.py, 고도화/sanity/*.py |
| DOCS-WIKI-AUDIT | 플랜, LLM Wiki, completion audit 갱신 | FINAL_PLAN.md, Detailed_PLAN.MD, LLM_WIKI_HOME.md, audit matrix |

## Required Artifacts

| artifact | path | purpose |
|---|---|---|
| Frontend implementation | J:/PortableApps/genai/projects/ai-agentic-soc/soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js | RedTeam2 UX and operator submission flow |
| Backend implementation | J:/PortableApps/genai/projects/ai-agentic-soc/runtime/redteam_v2_models.py | Submission template generation |
| API router | J:/PortableApps/genai/projects/ai-agentic-soc/runtime/redteam_v2_api_router.py | New endpoint exposure |
| Tests | J:/PortableApps/genai/projects/ai-agentic-soc/tests/test_redteam_v2_api_router.py | API behavior coverage |
| Sanity tests | J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/sanity | Frontend contract verification |
| Planning docs | J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/FINAL_PLAN.md and Detailed_PLAN.MD | Updated detailed plan |

## Verification Criteria

| criterion | evidence_required |
|---|---|
| Python syntax valid | py_compile exit_code=0 |
| Frontend syntax valid | node --check exit_code=0 |
| Router tests pass | tests/test_redteam_v2_api_router.py exit_code=0 |
| Frontend contract tests pass | launch/runtime/Korean copy sanity exit_code=0 |
| Completion audit valid | completion audit sanity and json.tool exit_code=0 |
| Goal state not overstated | goal-completion-review reports blocked with remaining gaps |

## Completion Definition

This task is complete only when the implementation, docs, tests, evidence session, handoff, commit, and push are complete. The product goal remains incomplete until real operating evidence closes the remaining gaps.
