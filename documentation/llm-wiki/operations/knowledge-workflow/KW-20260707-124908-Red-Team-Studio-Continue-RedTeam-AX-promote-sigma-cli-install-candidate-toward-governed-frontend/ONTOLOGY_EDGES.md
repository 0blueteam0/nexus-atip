---
type: ontology_edges
status: draft
project: Red Team Studio
created: 2026-07-07T12:49:08+09:00
---

# Ontology Edges

- RedTeam AX -> optional_tool_profile -> Sigma CLI
- Sigma CLI -> validates -> local Sigma rule
- Sigma CLI output -> normalized_by -> NORMALIZER-SIGMA-CLI-001
- Sigma CLI output -> analyzed_by -> AGENT-SIGMA-CLI-ANALYST-001
- Sigma CLI Evidence candidate -> must_not_replace -> required six-tool coverage
- Sigma CLI runtime -> has_risk -> shared venv dependency conflict

| subject | predicate | object | evidence_id | note |
|---|---|---|---|---|
|  |  |  |  |  |
