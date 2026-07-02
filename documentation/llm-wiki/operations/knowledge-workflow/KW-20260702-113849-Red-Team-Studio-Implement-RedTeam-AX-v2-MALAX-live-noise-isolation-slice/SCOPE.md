---
type: scope
task_id: KW-20260702-113849-Red-Team-Studio-Implement-RedTeam-AX-v2-MALAX-live-noise-isolation-slice
project: Red-Team-Studio
task: Implement RedTeam AX v2 MALAX live noise isolation slice
created: 2026-07-02T11:38:49+09:00
enforcement_level: L2-or-higher
---

# Scope

## User Intent

Describe the user's request as an operational task.

## Included

-

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

Autofill timestamp: 2026-07-02T11:43:20+09:00
Project: Red-Team-Studio
Task: Implement RedTeam AX v2 MALAX live noise isolation slice
Agent: codex
Status: ready_for_handoff
Summary: Slice 40 isolated MALAX live polling noise that affected Report Studio and RedTeam2 browser smoke. The MALAX bridge now catches core RecordStore failures for /api/malax/latest and /api/malax/runs, returns a degraded latest payload or legacy run fallback instead of HTTP 500, and the RedTeam AX live browser smoke now waits for domcontentloaded/body visibility instead of networkidle so ongoing MALAX polling does not block DOM verification.
Next action: Continue from the recorded handoff and latest evidence.
Artifacts:
- J:/PortableApps/genai/projects/ai-agentic-soc/runtime/malware_upload_api.py
- J:/PortableApps/genai/projects/ai-agentic-soc/tests/test_malax_bridge_degraded.py
- J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/sanity/redteam_ax_live_browser_parser_smoke.py
- J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-browser-smoke/latest_live_browser_parser_smoke.json
- J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/FINAL_PLAN.md
Commands:
- python tests/test_malax_bridge_degraded.py -> 2 tests OK
- python tests/test_redteam_v2_api_router.py -> 42 tests OK
- python -m py_compile runtime/malware_upload_api.py redteam_ax_live_browser_parser_smoke.py -> exit 0
- Invoke-RestMethod /api/malax/latest and /api/malax/runs?limit=8 against live 8765 -> both HTTP 200
- redteam_ax_live_browser_parser_smoke.py --allow-browser --allow-action --require-live -> status passed, blockers []
- python tests/test_redteam_v2_sample_e2e.py -> 1 test OK
- npm.cmd run build in frontend/report-studio-vite -> vite build OK
- python Red Team Studio/고도화/sanity/test_plan_contract.py -> plan contract sanity passed
Risks:
- Underlying MALAX workspace/storage disk I/O root cause is not fixed; it is isolated from UI polling and remains tracked separately in FINAL_PLAN.

Completion definition: the session can close when the recorded artifacts, command evidence, decisions, risks, and handoff are sufficient for a future agent to resume without chat memory.
