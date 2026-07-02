---
type: scope
task_id: KW-20260702-224536-Red-Team-Studio-RedTeam-AX-tool-result-claim-evidence-matrix-draft-API-slice
project: Red Team Studio
task: RedTeam AX tool result claim evidence matrix draft API slice
created: 2026-07-02T22:45:36+09:00
enforcement_level: L2-or-higher
---

# Scope

## User Intent

RedTeam AX의 tool result Finding/Claim review 후보를 최종 보고서에 바로 삽입하지 않고, Evidence Card 승인과 Finding severity 2인 승인이 끝난 후보만 Claim-Evidence Matrix report validation payload preview로 올리는 안전한 API slice를 구현한다.

## Included

- `/api/redteam/v2/tool-result-finding-claim-review/matrix-draft` backend API
- 승인 전 보류와 승인 후 ready preview를 검증하는 API regression tests
- RedTeam2 runtime readiness panel의 한국어 안내와 frontend contract sanity
- `FINAL_PLAN.md`, `Detailed_PLAN.MD`, LLM Wiki, completion audit 갱신
- accepted gate manifest 재실행

## Excluded

- Docker/WSL/OpenVAS/ZAP 운영 실측 blocker 해소
- 모든 real 후보의 최종 Finding 승인 및 Report v2 생성
- 도구 실행, 능동 스캔, report claim 자동 삽입

## Work Units

| unit | description | expected_artifact |
|---|---|---|
| backend | Matrix draft API와 model function 추가 | `runtime/redteam_v2_models.py`, `runtime/redteam_v2_api_router.py` |
| tests | held/ready 경로 API regression | `tests/test_redteam_v2_api_router.py` |
| frontend | RedTeam2 한국어 안내와 contract anchor 추가 | `reports.js`, sanity scripts |
| docs | 플랜/LLM Wiki/completion audit 갱신 | `FINAL_PLAN.md`, `Detailed_PLAN.MD`, `LLM_WIKI_HOME.md`, audit matrix |

## Required Artifacts

| artifact | path | purpose |
|---|---|---|
| Accepted gate manifest | `projects/ai-agentic-soc/archive/runs/redteam-ax-v2-accepted-gates/latest_accepted_gate_manifest.json` | 전체 accepted gate 24/24 통과 증거 |
| Korean copy inventory | `projects/ai-agentic-soc/Red Team Studio/고도화/completion-audit/redteam2_korean_copy_inventory.json` | RedTeam2 visible copy sanity 결과 |
| Completion audit | `projects/ai-agentic-soc/Red Team Studio/고도화/completion-audit/redteam_ax_completion_audit_matrix.json` | 목표 완료/미완료 판정 장부 |

## Verification Criteria

| criterion | evidence_required |
|---|---|
| Scope declared | `SCOPE.md` |
| Evidence recorded | `EVIDENCE_UNITS.md` |
| Gate closed | `QUALITY_GATE_RESULT.json` |

## Completion Definition

The task is complete only when scope, artifacts, evidence, decisions, handoff, and gate result exist.
