---
type: scope
task_id: KW-20260707-130637-Red-Team-Studio-Continue-RedTeam-AX-required-tool-frontend-execution-and-evidence-collection-int
project: Red Team Studio
task: Continue RedTeam AX required tool frontend execution and evidence collection integration
created: 2026-07-07T13:06:37+09:00
enforcement_level: L2-or-higher
---

# Scope

## User Intent

Continue the RedTeam AX goal by moving required red-team tooling from catalog/readiness toward real installed tool evidence, frontend launch readiness, governed execution policy, and evidence collection traceability.

## Included

- Install Nuclei from the official ProjectDiscovery release into a project-local portable tools path.
- Record Nuclei version/hash evidence and pin the wrapper hash in the ToolProfile.
- Extend runtime wrapper discovery to resolve project-local portable tools.
- Keep Nuclei high-risk execution gated by ROE/HITL even after installation and hash trust pass.
- Update Detailed_PLAN.MD and FINAL_PLAN.md.
- Run focused backend/frontend sanity checks.

## Excluded

- Do not run Nuclei active scans or template updates.
- Do not commit the downloaded Nuclei binary/archive.
- Do not mark the full goal complete because OpenVAS, Trivy, SCA, npm audit, OWASP ZAP full operational E2E remains incomplete.

## Work Units

| unit | description | expected_artifact |
|---|---|---|
| WU-001 | Install and verify Nuclei portable binary | local tool install evidence |
| WU-002 | Runtime discovery and hash pin update | redteam_v2_models.py |
| WU-003 | Regression coverage | test_redteam_v2_api_router.py |
| WU-004 | Plan updates | Detailed_PLAN.MD, FINAL_PLAN.md |

## Required Artifacts

| artifact | path | purpose |
|---|---|---|
| Runtime model | J:/PortableApps/genai/projects/ai-agentic-soc/runtime/redteam_v2_models.py | portable tool discovery and Nuclei expected hash |
| API tests | J:/PortableApps/genai/projects/ai-agentic-soc/tests/test_redteam_v2_api_router.py | regression coverage |
| Detailed plan | J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/Detailed_PLAN.MD | implementation plan trace |
| Final plan | J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/FINAL_PLAN.md | checklist trace |

## Verification Criteria

| criterion | evidence_required |
|---|---|
| Nuclei installed | version command and SHA-256 evidence in EVIDENCE_UNITS.md |
| Runtime detects portable tool | manifest output shows hash_match/trusted_for_runner |
| HITL preserved | launch readiness keeps human_approval_required for Nuclei |
| Tests pass | pytest/frontend sanity command evidence |
| Gate closed | QUALITY_GATE_RESULT.json |

## Completion Definition

This slice is complete when Nuclei portable install, runtime discovery, hash pin, tests, docs, and knowledge workflow gate pass. The active user goal remains incomplete until all required tools and full Evidence/Finding/Matrix/Report gates are complete.
