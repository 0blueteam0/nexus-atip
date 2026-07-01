# Work Command Agent Roster

## Agents / Roles Represented

- Codex implementation agent:
  - inspected current repository state
  - implemented backend route/model changes
  - implemented frontend Report Studio UX
  - added regression test
  - ran verification commands
  - updated plan and knowledge workflow

- RedTeam AX analyst user role:
  - selects browser tool output artifact
  - provides approved case context through ToolActionCard
  - reviews sanitizer, schema, parser, and evidence candidate state

- LLM analysis agent role:
  - represented by registered RedTeam AX analysis agents
  - receives only sanitized/stored tool output as untrusted data
  - produces normalized candidate evidence, not final claims

- Human approval roles:
  - remain unchanged: red team lead, control team, second approver, business owner, executive sponsor
  - no new bypass of HITL or high-risk approval was introduced
