---
type: scope
task_id: KW-20260702-135058-Red-Team-Studio-RedTeam-AX-OpenVAS-ZAP-credential-vault-contract-slice
project: Red-Team-Studio
task: RedTeam AX OpenVAS ZAP credential vault contract slice
created: 2026-07-02T13:50:58+09:00
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

Autofill timestamp: 2026-07-02T13:58:12+09:00
Project: Red-Team-Studio
Task: RedTeam AX OpenVAS ZAP credential vault contract slice
Agent: codex
Status: ready_for_handoff
Summary: RedTeam AX OpenVAS/ZAP credential vault contract slice added read-only credential policy registry, external vault reference authorization API, Korean RedTeam2 UI panel, tests, audit matrix, plan, and LLM wiki updates.
Next action: Implement full accepted gate manifest or run additional installed scanner live smokes when approved scanner CLIs are available.
Artifacts:
- J:/PortableApps/genai/projects/ai-agentic-soc/runtime/redteam_v2_models.py
- J:/PortableApps/genai/projects/ai-agentic-soc/runtime/redteam_v2_api_router.py
- J:/PortableApps/genai/projects/ai-agentic-soc/tests/test_redteam_v2_api_router.py
- J:/PortableApps/genai/projects/ai-agentic-soc/soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js
- J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/completion-audit/redteam_ax_completion_audit_matrix.json
- J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2/CASE-V2-CREDENTIAL-VAULT-001
- J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-browser-smoke/latest_live_browser_parser_smoke.json
Commands:
- pytest tests/test_redteam_v2_api_router.py -q => exit 0, 50 passed
- pytest tests/test_redteam_v2_sample_e2e.py -q => exit 0, 1 passed
- node --check reports.js => exit 0
- npm.cmd run build => exit 0
- test_completion_audit_matrix.py => exit 0
- test_plan_contract.py => exit 0
- test_redteam2_korean_copy_inventory.py => exit 0
- redteam_ax_live_browser_parser_smoke.py --allow-browser --require-live => exit 0, status passed
- py_compile redteam_v2_models.py redteam_v2_api_router.py => exit 0
Risks:
- Remaining completion gaps are Nuclei/OpenVAS/Trivy/ZAP plus Docker/container runtime live smoke artifacts and full accepted gate manifest; credential authorization does not execute scanners.

Completion definition: the session can close when the recorded artifacts, command evidence, decisions, risks, and handoff are sufficient for a future agent to resume without chat memory.
