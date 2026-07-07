---
type: work_command_record
task_id: KW-20260707-122829-Red-Team-Studio-Continue-RedTeam-AX-expanded-redteam-tool-install-discovery-catalog
project: Red Team Studio
task: Continue RedTeam AX expanded redteam tool install discovery catalog
created: 2026-07-07T12:28:30+09:00
source_package: K:/wiki/work command
---

# HANDOFF

## Summary

This slice adds official-source install/onboarding candidates for additional redteam tools: Amass, ffuf, Nmap, and Gitleaks. The API now returns `discovered_candidate_tools` and the frontend report studio shows an additional candidate table under the analysis tool hub.

## Changed Files

- `projects/ai-agentic-soc/runtime/redteam_v2_models.py`
- `projects/ai-agentic-soc/tests/test_redteam_v2_api_router.py`
- `projects/ai-agentic-soc/soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js`
- `projects/ai-agentic-soc/Red Team Studio/고도화/sanity/redteam_ax_frontend_runtime_readiness_contract.py`
- `projects/ai-agentic-soc/Red Team Studio/Detailed_PLAN.MD`
- `projects/ai-agentic-soc/Red Team Studio/FINAL_PLAN.md`

## Verification

All checks passed before handoff: Python compile, Node syntax check, pytest targeted contract, frontend runtime readiness sanity, frontend launch readiness sanity, and git diff whitespace check.

## Next Actions

Promote candidates one at a time into approved ToolProfiles only after install verification, version pinning, ROE risk classification, guardrail policy, output normalizer, Evidence Card mapping, Claim-Evidence Matrix mapping, and frontend run-button tests are added. Continue expanding the catalog from SPEC 24 with SpiderFoot, subfinder/httpx, GoWitness, EyeWitness, BloodHound, PingCastle, Certipy, Stratus Red Team, Caldera, Atomic Red Team, OpenBAS, VECTR, Attack Flow, Timesketch, Velociraptor, Sigma, PyRIT, Garak, Inspect, and AgentDojo.

## Original Request

## Current Interpretation

## Current State

## Decision Record

## Execution Record

## Tools And Capability

## Next Actions
