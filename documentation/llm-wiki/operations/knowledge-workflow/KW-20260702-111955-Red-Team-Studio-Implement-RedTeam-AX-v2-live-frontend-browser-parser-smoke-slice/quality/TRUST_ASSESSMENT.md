---
type: trust_assessment
task_id: KW-20260702-111955-Red-Team-Studio-Implement-RedTeam-AX-v2-live-frontend-browser-parser-smoke-slice
project: Red-Team-Studio
task: Implement RedTeam AX v2 live frontend browser parser smoke slice
created: 2026-07-02T11:19:55+09:00
---

# Trust Assessment

## Claims

| claim | confidence_1_to_5 | evidence | uncertainty | review_needed |
|---|---:|---|---|---|
|  |  |  |  |  |

## Overclaim Check

## Hallucination Check

## Bias Check

## Required Follow-Up


## Autofill Quality Evidence

Claim under assessment: Slice 38 started the Vite frontend on http://127.0.0.1:5177 and completed a live Playwright browser/parser smoke for Report Studio RedTeam AX v2. The harness now clicks the Report Studio menu and RedTeam2 tab before checking RedTeam AX v2, ToolActionCard, HITL, Evidence Card, and Claim-Evidence Matrix DOM signals. Current artifact status is passed with frontend/backend readiness ready and blockers empty.

Confidence: evidence-backed for the listed artifacts and commands.
Uncertainty: any remaining risk listed below still requires follow-up.
Review needed: yes if the project-specific final gate is not clean.

Autofill timestamp: 2026-07-02T11:25:12+09:00
Project: Red-Team-Studio
Task: Implement RedTeam AX v2 live frontend browser parser smoke slice
Agent: codex
Status: ready_for_handoff
Summary: Slice 38 started the Vite frontend on http://127.0.0.1:5177 and completed a live Playwright browser/parser smoke for Report Studio RedTeam AX v2. The harness now clicks the Report Studio menu and RedTeam2 tab before checking RedTeam AX v2, ToolActionCard, HITL, Evidence Card, and Claim-Evidence Matrix DOM signals. Current artifact status is passed with frontend/backend readiness ready and blockers empty.
Next action: Continue from the recorded handoff and latest evidence.
Artifacts:
- J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/sanity/redteam_ax_live_browser_parser_smoke.py
- J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-browser-smoke/latest_live_browser_parser_smoke.json
- J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/FINAL_PLAN.md
Commands:
- npm.cmd run dev -- --host 127.0.0.1 --port 5177 -> Vite ready on 127.0.0.1:5177
- python Red Team Studio/고도화/sanity/redteam_ax_live_browser_parser_smoke.py --allow-browser --require-live -> exit 0, status passed
- python -m py_compile Red Team Studio/고도화/sanity/redteam_ax_live_browser_parser_smoke.py -> exit 0
- J:/PortableApps/genai/projects/ai-agentic-soc/.venv/Scripts/python.exe -m unittest discover -s tests -p test_redteam_v2_api_router.py -> exit 0, 42 tests OK
- J:/PortableApps/genai/projects/ai-agentic-soc/.venv/Scripts/python.exe -m unittest discover -s tests -p test_redteam_v2_sample_e2e.py -> exit 0, 1 test OK
- node --check reports.js -> exit 0
- npm.cmd run build -> exit 0
- python Red Team Studio/고도화/sanity/test_plan_contract.py -> exit 0
Risks:
- Next live browser slice still needs a controlled ToolActionCard plan click and queue/API evidence assertion. The current smoke proves DOM/workbench availability, not end-to-end tool action creation.
