---
type: evidence_unit
status: draft
id:
project: Red-Team-Studio
created: 2026-07-03T05:07:47+09:00
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

## Evidence units added 2026-07-03

- `command`: `.venv/Scripts/python.exe -m pytest tests/test_redteam_v2_api_router.py::RedTeamV2ApiRouterTests::test_v2_toolchain_runtime_preflight_blocks_runner_before_commands -q`
  - `exit_code`: 0
  - `verified_at`: 2026-07-03
  - `artifact_path`: API response assertion in regression test
- `command`: `.venv/Scripts/python.exe -m pytest tests/test_redteam_v2_api_router.py -q`
  - `exit_code`: 0
  - `verified_at`: 2026-07-03
  - `result`: 74 passed, 1 warning
- `command`: `.venv/Scripts/python.exe Red Team Studio/고도화/sanity/redteam_ax_accepted_gate_manifest.py`
  - `exit_code`: 0
  - `verified_at`: 2026-07-03
  - `artifact_path`: `J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-accepted-gates/latest_accepted_gate_manifest.json`
  - `result`: accepted_gate_count 24, passed_gate_count 24, failed_gate_count 0
- `source_path`: `runtime/redteam_v2_models.py`
  - `evidence_level`: source contract
  - `claim`: runner-mode governed toolchain execution can be blocked before subprocess launch by runtime readiness preflight.
- `source_path`: `soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js`
  - `evidence_level`: frontend contract
  - `claim`: RedTeam2 sends `require_runtime_preflight` for runner mode and renders `실행 전 readiness`.
- `command`: `.venv/Scripts/python.exe Red Team Studio/고도화/sanity/test_completion_audit_matrix.py`
  - `exit_code`: 0
  - `verified_at`: 2026-07-03
  - `claim`: revised goal condition for excluding non-operational development byproducts is represented without marking the goal complete.
- `command`: `.venv/Scripts/python.exe Red Team Studio/고도화/sanity/redteam_ax_accepted_gate_manifest.py`
  - `exit_code`: 0
  - `verified_at`: 2026-07-03
  - `result`: accepted_gate_count 24, passed_gate_count 24, failed_gate_count 0 after revised objective documentation.
