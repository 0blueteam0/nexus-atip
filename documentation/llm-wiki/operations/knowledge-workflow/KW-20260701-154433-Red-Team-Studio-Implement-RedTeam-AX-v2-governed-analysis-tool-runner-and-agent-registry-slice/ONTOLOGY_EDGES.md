---
type: ontology_edges
status: complete
project: Red Team Studio
created: 2026-07-01T15:44:33+09:00
updated: 2026-07-01T16:03:00+09:00
---

# Ontology Edges

| subject | predicate | object | evidence_id | note |
|---|---|---|---|---|
| RedTeam AX v2 | has_component | Analysis ToolHub | EU-REDTEAM-AX-TOOLHUB-AGENTS-20260701 | registry/API/UI foundation |
| Analysis ToolHub | registers | Nuclei/OpenVAS/Trivy/SCA/npm audit/OWASP ZAP | EU-REDTEAM-AX-TOOLHUB-AGENTS-20260701 | requested tools |
| Active Scanner | requires | ToolActionCard approval | EU-REDTEAM-AX-TOOLHUB-AGENTS-20260701 | T3 approval gate |
| ToolRunRecord | contains | untrusted output envelope | EU-REDTEAM-AX-TOOLHUB-AGENTS-20260701 | prompt injection control |
| LLM Analysis Agent | produces | Normalized Result | EU-REDTEAM-AX-TOOLHUB-AGENTS-20260701 | evidence candidate path |
