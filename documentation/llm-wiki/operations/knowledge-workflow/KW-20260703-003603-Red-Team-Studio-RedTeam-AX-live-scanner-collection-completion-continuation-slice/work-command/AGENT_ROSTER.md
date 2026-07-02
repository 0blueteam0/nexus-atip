# AGENT_ROSTER

## Agents In Scope

- Codex: implementation, regression tests, docs, gate execution.
- RedTeam AX LLM analyst agents: represented by normalizer/agent IDs for Nuclei, OpenVAS, Trivy, SCA, npm audit, and OWASP ZAP in the regression path.
- Human reviewer roles: red_team_lead, business_owner, executive_sponsor remain required in the tested approval/export path.

## Agents Not Executed

No external LLM, MCP scanner, OpenVAS/ZAP daemon, Docker container, or active scanner agent was invoked in this slice.
