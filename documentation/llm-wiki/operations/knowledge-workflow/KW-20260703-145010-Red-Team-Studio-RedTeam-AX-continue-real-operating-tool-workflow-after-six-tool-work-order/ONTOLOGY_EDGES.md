---
type: ontology_edges
status: complete
project: Red-Team-Studio
task: RedTeam AX continue real operating tool workflow after six-tool work order
created: 2026-07-03T14:50:10+09:00
---

# Ontology Edges

| source | relation | target | evidence |
|---|---|---|---|
| RedTeam2 Analyst Guide | separates_from | Admin Runtime Configuration | reports.js |
| Six Tool Submission Template API | produces | Collection Package | redteam_v2_models.py |
| Collection Package | feeds | Operator Evidence Submission Manifest Draft | API next_api |
| Operator Artifact Paths | validate_as | Evidence Card Candidates | existing RedTeam AX evidence pipeline |
| Goal Completion Review | blocks | Final Goal Completion | remaining_gap_count=3 |

## Graph Candidate

```json
{
  "nodes": [
    {"id": "RedTeam2 Analyst Guide", "type": "ui_panel"},
    {"id": "Admin Runtime Configuration", "type": "ui_panel"},
    {"id": "Six Tool Submission Template API", "type": "api"},
    {"id": "Collection Package", "type": "evidence_input"},
    {"id": "Operator Evidence Submission Manifest Draft", "type": "api"},
    {"id": "Evidence Card Candidates", "type": "evidence"}
  ],
  "edges": [
    {"from": "RedTeam2 Analyst Guide", "to": "Admin Runtime Configuration", "relation": "separates_from"},
    {"from": "Six Tool Submission Template API", "to": "Collection Package", "relation": "produces"},
    {"from": "Collection Package", "to": "Operator Evidence Submission Manifest Draft", "relation": "feeds"},
    {"from": "Operator Evidence Submission Manifest Draft", "to": "Evidence Card Candidates", "relation": "supports"}
  ]
}
```
