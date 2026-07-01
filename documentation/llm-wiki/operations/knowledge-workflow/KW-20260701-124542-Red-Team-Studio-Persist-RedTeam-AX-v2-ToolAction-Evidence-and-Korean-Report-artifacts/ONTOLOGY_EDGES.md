---
type: ontology_edges
task_id: KW-20260701-124542-Red-Team-Studio-Persist-RedTeam-AX-v2-ToolAction-Evidence-and-Korean-Report-artifacts
project: Red Team Studio
---

# Ontology Edges

| source | relation | target |
|---|---|---|
| `ToolActionCard` | persists_to | `archive/runs/redteam-ax-v2/{case_id}/tool-actions` |
| `ManualRunRecord` | persists_to | `manual-runs` |
| `EvidenceCard` | persists_to | `evidence` |
| `ReportValidationResult` | persists_to | `report-validations` |
| `Korean Red Team Report v2` | persists_to | `reports/*.md` |
| `ReportGate pass` | enables | `Markdown report artifact` |
