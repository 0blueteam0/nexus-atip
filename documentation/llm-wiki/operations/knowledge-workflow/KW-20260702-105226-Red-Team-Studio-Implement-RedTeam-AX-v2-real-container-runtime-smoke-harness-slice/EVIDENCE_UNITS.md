---
type: evidence_unit
status: draft
id:
project: Red-Team-Studio
created: 2026-07-02T10:52:26+09:00
---

# Evidence Unit

## Claim

## Source

- source_type:
- path_or_url:
- command:
- exit_code:
- collected_at:

## Evidence

## Confidence

## Limits

## Related Decisions



## Autofill Evidence Unit

Claim: Implemented RedTeam AX v2 slice 36 real container runtime smoke harness. Added Red Team Studio/고도화/sanity/redteam_ax_container_runtime_smoke.py as a safe-by-default harness: default mode performs Docker/Podman runtime preflight and writes evidence without executing containers; real execution requires --allow-real or REDTEAM_AX_REAL_CONTAINER_SMOKE=1. The harness records Docker daemon readiness, local image digest availability without pulling, and when opted in uses the FastAPI ephemeral_container runner path to verify stdout/stderr raw artifact capture. Current environment evidence shows Docker CLI is installed but daemon is blocked with Server:null and Docker Desktop is unable to start, so the harness records blocked_container_runtime_not_ready. FINAL_PLAN records slice 36 complete for harness/blocker evidence and keeps daemon-ready --allow-real smoke plus real scanner stdout parser E2E pending.

Source:
- source_type: local_session
- path_or_url: J:\PortableApps\genai\documentation\llm-wiki\operations\knowledge-workflow\KW-20260702-105226-Red-Team-Studio-Implement-RedTeam-AX-v2-real-container-runtime-smoke-harness-slice
- command: knowledge_workflow.py autofill
- exit_code: pending_until_close
- collected_at: 2026-07-02T11:08:04+09:00

Evidence artifacts:
- projects/ai-agentic-soc/Red Team Studio/고도화/sanity/redteam_ax_container_runtime_smoke.py
- projects/ai-agentic-soc/archive/runs/redteam-ax-v2-runtime-smoke/latest_container_runtime_smoke.json
- projects/ai-agentic-soc/Red Team Studio/FINAL_PLAN.md

Command evidence:
- .venv/Scripts/python.exe Red Team Studio/고도화/sanity/redteam_ax_container_runtime_smoke.py => exit_code 0, status blocked_container_runtime_not_ready, blocker docker_daemon_unavailable_or_not_started
- .venv/Scripts/python.exe -m py_compile Red Team Studio/고도화/sanity/redteam_ax_container_runtime_smoke.py => exit_code 0
- .venv/Scripts/python.exe -m unittest discover -s tests -p test_redteam_v2_api_router.py => exit_code 0, Ran 42 tests OK
- .venv/Scripts/python.exe -m unittest discover -s tests -p test_redteam_v2_sample_e2e.py => exit_code 0, Ran 1 test OK
- node --check soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js => exit_code 0
- .venv/Scripts/python.exe Red Team Studio/고도화/sanity/test_plan_contract.py => exit_code 0, plan contract sanity passed

Limits:
- Current host cannot complete real container stdout/stderr smoke because Docker daemon reports Server:null and Docker Desktop is unable to start.
