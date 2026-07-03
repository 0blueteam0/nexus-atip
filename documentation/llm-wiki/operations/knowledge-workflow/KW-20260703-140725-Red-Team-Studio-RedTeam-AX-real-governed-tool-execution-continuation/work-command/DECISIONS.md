---
type: work_command_record
task_id: KW-20260703-140725-Red-Team-Studio-RedTeam-AX-real-governed-tool-execution-continuation
project: Red-Team-Studio
task: RedTeam AX real governed tool execution continuation
created: 2026-07-03T14:07:25+09:00
updated: 2026-07-03T14:32:00+09:00
source_package: K:/wiki/work command
---

# DECISIONS

## Decision 1

Use an opt-in payload flag instead of weakening the default runtime preflight.

## Evidence Fields

- command: targeted pytest for partial and full runtime preflight cases
- exit_code: 0
- artifact_path: `J:/PortableApps/genai/projects/ai-agentic-soc/tests/test_redteam_v2_api_router.py`
- verified_at: 2026-07-03T14:32:00+09:00

## Decision 2

Allow only local subprocess version argv, not scan argv.

## Evidence Fields

- command: targeted pytest verifies `npm.cmd --version` executed and `trivy fs --format json .` blocked
- exit_code: 0
- artifact_path: `J:/PortableApps/genai/projects/ai-agentic-soc/runtime/redteam_v2_models.py`
- verified_at: 2026-07-03T14:32:00+09:00
