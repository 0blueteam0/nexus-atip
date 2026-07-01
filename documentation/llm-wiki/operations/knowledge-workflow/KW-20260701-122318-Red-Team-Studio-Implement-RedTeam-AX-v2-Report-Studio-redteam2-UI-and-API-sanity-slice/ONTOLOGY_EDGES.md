---
type: ontology_edges
task_id: KW-20260701-122318-Red-Team-Studio-Implement-RedTeam-AX-v2-Report-Studio-redteam2-UI-and-API-sanity-slice
project: Red Team Studio
---

# Ontology Edges

| source | relation | target |
|---|---|---|
| `레드팀 분석2` | implements | `ToolActionCard workbench` |
| `ToolActionCard` | requires | `ROE evaluation` |
| `ToolActionCard` | may_require | `HITL approval` |
| `ManualRunRecord` | produces | `EvidenceCard candidate` |
| `EvidenceCard` | supports | `Claim-Evidence Matrix` |
| `Claim-Evidence Matrix` | gates | `Korean Red Team Report v2` |
| `/api/redteam/v2/reports/validate` | blocks | `unsupported claim` |
| `/api/redteam/v2/reports/validate` | blocks | `unapproved high-risk action` |
| `/api/redteam/v2/reports/validate` | blocks | `finding without evidence` |
