---
type: work_command_record
task_id: KW-20260702-223200-Red-Team-Studio-RedTeam-AX-finding-claim-candidate-promotion-API-slice
project: Red Team Studio
task: RedTeam AX finding claim candidate promotion API slice
created: 2026-07-02T22:32:00+09:00
source_package: K:/wiki/work command
---

# AGENT_ROSTER

## Roles Considered

| role | responsibility | used | reason |
|---|---|---|---|

## Handoff Rules

## Active Agent

- provider: Codex
- role: implementation, test, documentation, and git push agent
- responsibility: add scoped promotion API, update RedTeam2 Korean UI contract, run accepted gate, preserve handoff.

## Human Roles

- red_team_lead: approve Evidence and Finding severity.
- business_owner: provide second severity approval and business impact validation.
- platform_operator: resolve Docker/WSL/OpenVAS/ZAP readiness blockers.

## Handoff Rule

Future agents must not treat promotion success as final report approval. It is only a pending-review Finding draft creation.
