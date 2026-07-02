---
type: work_command_record
task_id: KW-20260701-174914-Red-Team-Studio-Implement-RedTeam-AX-v2-container-runner-isolation-readiness-slice
project: Red-Team-Studio
task: Implement RedTeam AX v2 container runner isolation readiness slice
created: 2026-07-01T17:49:14+09:00
source_package: K:/wiki/work command
---

# AGENT_ROSTER

## Roles Considered

| role | responsibility | used | reason |
|---|---|---|---|

## Handoff Rules

# Agent Roster

- Codex: primary implementer for this slice.
- Human analyst/operator: future approver and attestor for container runtime controls.
- Red team lead: future approver for high-risk execution and wrapper trust.
- Container runner service: future component; not implemented in this slice.
- LLM analysis agents: consume normalized results only; raw runner output remains untrusted data.
