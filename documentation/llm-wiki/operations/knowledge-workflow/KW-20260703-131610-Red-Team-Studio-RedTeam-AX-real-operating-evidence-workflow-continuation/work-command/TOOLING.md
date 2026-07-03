---
type: work_command_record
task_id: KW-20260703-131610-Red-Team-Studio-RedTeam-AX-real-operating-evidence-workflow-continuation
project: Red Team Studio
task: RedTeam AX real operating evidence workflow continuation
created: 2026-07-03T13:16:10+09:00
source_package: K:/wiki/work command
---

# TOOLING

| tool | use | command_or_api | exit_code | note |
|---|---|---|---:|---|
| Python | syntax and API tests | `py_compile`; `pytest` | 0 | existing venv |
| Node.js | frontend syntax | `node --check reports.js` | 0 | no build required for this slice |
| FastAPI TestClient | goal review | `POST /api/redteam/v2/goal-completion-review` | 0 | confirmed blocked status |
| `rg` | source lookup | endpoint and audit searches | 0 | used for low-noise inspection |
| KW tool | evidence gate | `knowledge_workflow.py close` | pending | this record resolves thin content failures |
