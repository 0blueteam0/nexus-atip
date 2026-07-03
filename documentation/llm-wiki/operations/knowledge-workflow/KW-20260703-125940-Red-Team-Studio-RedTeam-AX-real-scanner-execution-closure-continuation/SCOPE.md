---
type: scope
task_id: KW-20260703-125940-Red-Team-Studio-RedTeam-AX-real-scanner-execution-closure-continuation
project: Red Team Studio
task: RedTeam AX real scanner execution closure continuation
created: 2026-07-03T12:59:40+09:00
enforcement_level: L2-or-higher
---

# Scope

## User Intent

Continue the active RedTeam AX goal toward real governed execution and analysis of Nuclei, OpenVAS, Trivy, SCA, npm audit, and OWASP ZAP with Evidence Card and Claim-Evidence Matrix traceability.

## Included

- Inspect current SPEC and Agentic RAG source of truth.
- Improve the toolchain result collection boundary so partial multi-tool collection cannot be mistaken for full six-tool completion.
- Update plan, LLM Wiki, and completion audit artifacts.
- Run focused regression and sanity checks.

## Excluded

- Do not claim full goal completion.
- Do not execute active scanners, network scans, OpenVAS, or OWASP ZAP live imports.
- Do not treat development fixtures or smoke artifacts as final operating evidence.

## Work Units

| unit | description | expected_artifact |
|---|---|---|
| coverage-gate | Add six-tool required coverage fields to collection result | `runtime/redteam_v2_models.py` |
| regression | Verify two-tool partial and six-tool complete collection behavior | `tests/test_redteam_v2_api_router.py` |
| documentation | Update FINAL_PLAN, Detailed_PLAN, LLM Wiki, completion audit | Red Team Studio docs |
| verification | Run py_compile, targeted pytest, audit sanity, goal review | command outputs |

## Required Artifacts

| artifact | path | purpose |
|---|---|---|
| code | `J:/PortableApps/genai/projects/ai-agentic-soc/runtime/redteam_v2_models.py` | API implementation |
| tests | `J:/PortableApps/genai/projects/ai-agentic-soc/tests/test_redteam_v2_api_router.py` | regression evidence |
| plan | `J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/FINAL_PLAN.md` | goal tracking |
| audit | `J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/completion-audit/redteam_ax_completion_audit_matrix.json` | completion audit |

## Verification Criteria

| criterion | evidence_required |
|---|---|
| Scope declared | `SCOPE.md` |
| Evidence recorded | `EVIDENCE_UNITS.md` |
| Tests pass | pytest and sanity command records |
| Goal remains incomplete | goal-completion-review returns blocked |
| Gate closed | `QUALITY_GATE_RESULT.json` |

## Completion Definition

This slice is complete when the six-tool collection coverage gate is implemented, tested, documented, recorded, committed, and pushed. The active thread goal remains incomplete until real operating evidence and final gates are proven.
