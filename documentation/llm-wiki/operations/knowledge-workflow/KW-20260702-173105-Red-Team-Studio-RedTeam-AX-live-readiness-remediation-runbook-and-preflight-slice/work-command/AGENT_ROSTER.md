---
type: work_command_record
task_id: KW-20260702-173105-Red-Team-Studio-RedTeam-AX-live-readiness-remediation-runbook-and-preflight-slice
project: Red Team Studio
task: RedTeam AX live readiness remediation runbook and preflight slice
created: 2026-07-02T17:31:06+09:00
source_package: K:/wiki/work command
---

# AGENT_ROSTER

## Roles Considered

| role | responsibility | used | reason |
|---|---|---|---|
| Codex implementation agent | inspect repo, edit code/docs/tests, run gates | yes | current execution environment and user request require direct implementation |
| Security operator | start Docker/WSL and configure OpenVAS/ZAP endpoint/vault | no | external privileged operation requiring human control |
| RedTeam reviewer | verify ROE/HITL and no unsupported completion claim | partial | encoded through tests, completion audit, and documentation |
| Frontend reviewer | check Korean runtime readiness copy | partial | contract and Korean copy inventory used as automated proxy |

## Handoff Rules
Future agents must not treat this slice as live scanner readiness completion. They should read the remediation artifact, perform or request the operator actions, then rerun strict live readiness promotion and accepted gates. Any OpenVAS/ZAP execution must go through the case ROE/HITL path and produce Evidence Cards before report claims are created.
