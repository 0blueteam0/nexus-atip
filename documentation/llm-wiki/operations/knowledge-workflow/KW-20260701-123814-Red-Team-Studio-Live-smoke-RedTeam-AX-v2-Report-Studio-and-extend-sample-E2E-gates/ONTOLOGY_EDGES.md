---
type: ontology_edges
task_id: KW-20260701-123814-Red-Team-Studio-Live-smoke-RedTeam-AX-v2-Report-Studio-and-extend-sample-E2E-gates
project: Red Team Studio
---

# Ontology Edges

| source | relation | target |
|---|---|---|
| `5177 Report Studio` | renders | `레드팀 분석2` |
| `레드팀 분석2` | calls | `/api/redteam/v2/health` |
| `ToolActionCard 계획 button` | calls | `/api/redteam/v2/tool-actions/plan` |
| `ToolActionCard Queue` | displays | `ScopeValidated T3 HITL required` |
| `Sample E2E` | creates | `ManualRunRecord` |
| `ManualRunRecord` | promotes | `EvidenceCard candidate` |
| `EvidenceCard` | supports | `ReportValidationResult pass` |
| `ReportValidationResult pass` | enables | `Korean Red Team Report v2 draft` |
