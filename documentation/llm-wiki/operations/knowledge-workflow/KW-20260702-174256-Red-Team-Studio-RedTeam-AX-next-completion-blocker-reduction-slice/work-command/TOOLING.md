---
type: work_command_record
task_id: KW-20260702-174256-Red-Team-Studio-RedTeam-AX-next-completion-blocker-reduction-slice
project: Red Team Studio
task: RedTeam AX next completion blocker reduction slice
created: 2026-07-02T17:42:56+09:00
source_package: K:/wiki/work command
---

# TOOLING

## Tool Need

The slice needed safe frontend editing and regression verification, not privileged environment control.

## Candidates

| candidate | type | benefit | risk | decision |
|---|---|---|---|---|
| React store edit | frontend | adds visible runbook steps | copy drift | selected |
| frontend contract sanity | test | catches missing anchors | static-only | selected |
| accepted gate manifest | regression | broad verification | slower | selected |
| Docker/WSL command execution | system | might change blocker state | unsafe external mutation | rejected |
| OpenVAS/ZAP network probe | external | might validate services | endpoint/vault absent | rejected |

## Verification

Selected tooling passed targeted sanity and accepted gate manifest 19/19.
