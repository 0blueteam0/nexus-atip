---
type: scope
task_id: KW-20260702-152026-Red-Team-Studio-RedTeam-AX-scanner-and-container-runtime-live-smoke-slice
project: Red-Team-Studio
task: RedTeam AX scanner and container runtime live smoke slice
created: 2026-07-02T15:20:26+09:00
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

Autofill timestamp: 2026-07-02T15:29:32+09:00
Project: Red-Team-Studio
Task: RedTeam AX scanner and container runtime live smoke slice
Agent: codex
Status: ready_for_handoff
Summary: RedTeam AX scanner CLI live smoke slice: installed checksum-verified portable official Nuclei v3.10.0 and Trivy v0.72.0 under tools/redteam-ax, ran both through ToolActionCard, ExecutionPlan, wrapper pin, execution token, shell=false governed runner, sanitizer, agent normalization, and Evidence Card creation; accepted gate manifest now passes 10/10. OpenVAS/ZAP CLI or service and Docker daemon remain runtime blockers.
Next action: Provide or start OpenVAS/ZAP service endpoints and restore Docker Desktop daemon, then run remaining live smokes.
Artifacts:
- J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/sanity/redteam_ax_scanner_cli_live_smoke.py
- J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-scanner-cli-live-smoke/latest_scanner_cli_live_smoke.json
- J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-runtime-smoke/latest_container_runtime_smoke.json
- J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-accepted-gates/latest_accepted_gate_manifest.json
Commands:
- ../.venv/Scripts/python.exe 고도화/sanity/redteam_ax_scanner_cli_live_smoke.py => exit 0, Nuclei/Trivy passed
- ../.venv/Scripts/python.exe 고도화/sanity/redteam_ax_container_runtime_smoke.py --require-real => exit 1, Docker daemon unavailable blocker artifact
- ../.venv/Scripts/python.exe 고도화/sanity/redteam_ax_accepted_gate_manifest.py => exit 0, 10/10 gates passed
- ../.venv/Scripts/python.exe 고도화/sanity/test_completion_audit_matrix.py => exit 0
- ../.venv/Scripts/python.exe 고도화/sanity/test_plan_contract.py => exit 0
Risks:
- Large portable binaries are installed locally but should not be committed to GitHub; the smoke script re-downloads and verifies them from official release checksums.

Completion definition: the session can close when the recorded artifacts, command evidence, decisions, risks, and handoff are sufficient for a future agent to resume without chat memory.
