---
type: scope
task_id: KW-20260702-230847-Red-Team-Studio-RedTeam-AX-multi-tool-execution-result-collection-continuation-slice
project: Red Team Studio
task: RedTeam AX multi-tool execution result collection continuation slice
created: 2026-07-02T23:08:47+09:00
enforcement_level: L2-or-higher
---

# Scope

## User Intent

RedTeam AX 플랫폼에서 여러 설치 분석도구를 복합 실행한 뒤 결과 진행상황을 확인하고 Evidence Card와 Claim-Evidence Matrix로 추적할 수 있어야 한다. 이번 slice는 기존 governed toolchain execution 이후 결과 회수, Sanitizer, 도구별 LLM normalizer, Evidence Card 후보 생성 경로를 추가한다.

## Included

- Backend API: `/api/redteam/v2/toolchains/{toolchain_id}/collect-results`
- Frontend RedTeam2 Korean UI: result collection button, runtime readiness rows, collection status table
- API regression and frontend sanity coverage
- FINAL_PLAN, Detailed_PLAN, LLM Wiki, completion audit update

## Excluded

- 실제 운영망 Nuclei/OpenVAS/Trivy/SCA/npm audit/ZAP 전체 결과 승인과 final report export completion
- 승인 없는 active scan or high-risk execution

## Work Units

| unit | description | expected_artifact |
|---|---|---|
| backend | Load governed toolchain run, sanitize stored artifacts, normalize per tool, create candidate Evidence Cards | runtime/redteam_v2_models.py, runtime/redteam_v2_api_router.py |
| frontend | Expose Korean result collection button and table | reports.js |
| tests | Prove npm audit + Trivy toolchain collection path | tests/test_redteam_v2_api_router.py |
| docs | Preserve planning and audit trace | FINAL_PLAN.md, Detailed_PLAN.MD, LLM_WIKI_HOME.md, completion audit |

## Required Artifacts

| artifact | path | purpose |
|---|---|---|
| accepted gate manifest | projects/ai-agentic-soc/archive/runs/redteam-ax-v2-accepted-gates/latest_accepted_gate_manifest.json | 24 accepted gates passed |
| completion audit | projects/ai-agentic-soc/Red Team Studio/고도화/completion-audit/redteam_ax_completion_audit_matrix.json | requirement-to-evidence mapping |
| KW session | documentation/llm-wiki/operations/knowledge-workflow/KW-20260702-230847-Red-Team-Studio-RedTeam-AX-multi-tool-execution-result-collection-continuation-slice | execution evidence |

## Verification Criteria

| criterion | evidence_required |
|---|---|
| Scope declared | `SCOPE.md` |
| Evidence recorded | `EVIDENCE_UNITS.md` |
| Gate closed | `QUALITY_GATE_RESULT.json` |
| API regression | `pytest tests/test_redteam_v2_api_router.py -q` exits 0 |
| Accepted gates | `redteam_ax_accepted_gate_manifest.py` exits 0 with 24/24 passed |

## Completion Definition

The slice is complete only when code, tests, frontend copy, docs, evidence session, accepted gates, commit, and push are complete. The full active goal remains incomplete until real operating tool outputs are approved and final report/export gates pass.
