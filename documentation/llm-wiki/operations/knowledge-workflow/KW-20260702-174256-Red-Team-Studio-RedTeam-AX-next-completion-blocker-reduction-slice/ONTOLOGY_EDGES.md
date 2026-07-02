---
type: ontology_edges
project: Red Team Studio
task: RedTeam AX next completion blocker reduction slice
---

# Ontology Edges

## Nodes

- RedTeam2 runtime readiness panel
- Live readiness remediation runbook
- Docker readiness blocker
- WSL readiness blocker
- OpenVAS/ZAP endpoint and vault blocker
- Accepted gate manifest
- Completion audit RTA-COMP-015

## Edges

- RedTeam2 runtime readiness panel -> displays -> live remediation runbook steps
- Live remediation runbook -> decomposes -> strict promotion blockers
- Docker readiness blocker -> prevents -> real container smoke pass
- WSL readiness blocker -> prevents -> WSL runtime ready
- OpenVAS/ZAP endpoint and vault blocker -> prevents -> external scanner readiness/import pass
- Accepted gate manifest -> verifies -> frontend and regression health
- Completion audit RTA-COMP-015 -> remains -> partial until live promotion passes
