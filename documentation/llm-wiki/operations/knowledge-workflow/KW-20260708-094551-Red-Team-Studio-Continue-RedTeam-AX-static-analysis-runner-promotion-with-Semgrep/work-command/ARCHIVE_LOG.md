---
type: work_command_record
task_id: KW-20260708-094551-Red-Team-Studio-Continue-RedTeam-AX-static-analysis-runner-promotion-with-Semgrep
project: Red Team Studio
task: Continue RedTeam AX static analysis runner promotion with Semgrep
created: 2026-07-08T09:45:51+09:00
source_package: K:/wiki/work command
---

# ARCHIVE_LOG

## Backup And Savepoint

| target | action | savepoint | archive_path | recovery |
|---|---|---|---|---|

## Not Required Rationale

# Archive Log

- No runtime scan output files were manually archived outside the governed API smoke artifacts.
- Governed smoke created case artifacts under `archive/runs/redteam-ax-v2/CASE-V2-SEMGREP-BANDIT-SMOKE-*`.
- Knowledge workflow artifacts remain in this session directory.
- Tool venv is runtime state and should not be committed.
- Manifest and sample workspace are the durable recreation artifacts.
