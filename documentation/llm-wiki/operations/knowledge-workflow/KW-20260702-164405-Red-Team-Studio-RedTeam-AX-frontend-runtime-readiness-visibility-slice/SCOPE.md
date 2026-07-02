---
type: scope
task_id: KW-20260702-164405-Red-Team-Studio-RedTeam-AX-frontend-runtime-readiness-visibility-slice
project: Red Team Studio
task: RedTeam AX frontend runtime readiness visibility slice
created: 2026-07-02T16:44:05+09:00
enforcement_level: L2-or-higher
---

# Scope

## User Intent

Describe the user's request as an operational task.

## Included

- RedTeam AX v2 runtime readiness API, RedTeam2 frontend visibility panel, sanity gates, plan/wiki/audit updates, and handoff evidence.

## Excluded

- Only explicitly excluded items belong here. Default is include.

## Work Units

| unit | description | expected_artifact |
|---|---|---|
|  |  |  |

## Required Artifacts

| artifact | path | purpose |
|---|---|---|
|  |  |  |

## Verification Criteria

| criterion | evidence_required |
|---|---|
| Scope declared | `SCOPE.md` |
| Evidence recorded | `EVIDENCE_UNITS.md` |
| Gate closed | `QUALITY_GATE_RESULT.json` |

## Completion Definition

The task is complete only when scope, artifacts, evidence, decisions, handoff, and gate result exist.


## Autofill Scope

The session covers the work described in the summary below and keeps execution metadata inside this Knowledge Workflow session.

Autofill timestamp: 2026-07-02T16:53:17+09:00
Project: Red Team Studio
Task: RedTeam AX frontend runtime readiness visibility slice
Agent: codex
Status: ready_for_handoff
Summary: RedTeam AX v2 runtime readiness visibility slice: added read-only /api/redteam/v2/runtime-readiness, RedTeam2 runtime readiness panel, frontend contract sanity, accepted gate 15/15 manifest, and plan/wiki/audit updates.
Next action: When Docker daemon and organization OpenVAS/ZAP endpoints are available, rerun container runtime smoke with --allow-real --require-real and external scanner readiness with --allow-network --require-ready.
Artifacts:
- J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-accepted-gates/latest_accepted_gate_manifest.json
- J:/PortableApps/genai/projects/ai-agentic-soc/runtime/redteam_v2_api_router.py
- J:/PortableApps/genai/projects/ai-agentic-soc/runtime/redteam_v2_models.py
- J:/PortableApps/genai/projects/ai-agentic-soc/soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js
- J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/sanity/redteam_ax_frontend_runtime_readiness_contract.py
Commands:
- .venv/Scripts/python.exe Red Team Studio/고도화/sanity/redteam_ax_accepted_gate_manifest.py -> exit_code 0, accepted_gate_count 15, passed_gate_count 15, failed_gate_count 0
Risks:
- Goal remains active: Docker daemon real container smoke and organization OpenVAS/ZAP endpoint readiness are still environmental blockers, now visible in API/UI.

Completion definition: the session can close when the recorded artifacts, command evidence, decisions, risks, and handoff are sufficient for a future agent to resume without chat memory.
