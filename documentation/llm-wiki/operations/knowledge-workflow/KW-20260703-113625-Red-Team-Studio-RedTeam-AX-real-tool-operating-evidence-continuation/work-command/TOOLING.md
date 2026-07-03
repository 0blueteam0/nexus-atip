---
type: work_command_record
task_id: KW-20260703-113625-Red-Team-Studio-RedTeam-AX-real-tool-operating-evidence-continuation
project: Red Team Studio
task: RedTeam AX real tool operating evidence continuation
created: 2026-07-03T11:36:25+09:00
source_package: K:/wiki/work command
---

# TOOLING

## Tool Need

Need live runtime inspection, existing safety harness execution, regression testing, and completion-audit evidence preservation.

## Candidates

| candidate | type | benefit | risk | decision |
|---|---|---|---|---|
| Docker CLI | runtime probe | Direct server/image state | Can run containers | selected for version and approved smoke |
| `.venv` Python | runtime | Correct project dependencies | Requires path discipline | selected |
| RedTeam AX sanity scripts | repo harness | Canonical artifacts | Some gates are long-running | selected |
| pytest | test | Regression proof | Not live proof alone | selected |
| goal-completion-review API | audit | Prevents overclaim | Does not solve blockers | selected |

## Build vs Adopt

Adopt existing sanity harnesses and API tests. Build only the minimal launcher fix needed for deterministic approved argv execution.

## Selected Tool

`.venv\Scripts\python.exe`, Docker CLI, `redteam_ax_container_runtime_smoke.py`, `redteam_ax_strict_live_readiness_promotion.py`, `pytest`, accepted gate manifest.

## Verification

Docker smoke passed, pytest 76 passed, accepted gates 26/26 passed, completion review blocked as expected.
