---
type: scope
task_id: KW-20260703-135344-Red-Team-Studio-RedTeam-AX-governed-tool-execution-progress-and-result-continuation
project: Red-Team-Studio
task: RedTeam AX governed tool execution progress and result continuation
created: 2026-07-03T13:53:44+09:00
updated: 2026-07-03T14:18:00+09:00
---

# Scope

## Objective

Add a read-only RedTeam AX v2 saved toolchain run status reload path so the backend and RedTeam2 UI can reload a previously saved governed toolchain run and show whether results can be collected.

## Included

- Backend API `/api/redteam/v2/toolchains/{toolchain_id}/run-status`.
- Stored `toolchain-runs` artifact summarization with `step_rows`, `run_ids`, `can_collect_results`, `collectable_step_count`, and `primary_next_api`.
- RedTeam2 Korean button and tables: `저장 실행 상태 다시 불러오기`, `저장 실행 상태`, `저장 실행 단계`.
- API regression and frontend runtime sanity contract.
- FINAL_PLAN, Detailed_PLAN, LLM wiki, and completion audit matrix updates.

## Excluded

- Scanner command execution.
- Docker, WSL, network, active scan execution.
- Tool result collection itself.
- Evidence approval, Finding promotion, severity approval, Matrix, Report v2 export, and completion gate closure.
- Marking the active `/goal` complete.
