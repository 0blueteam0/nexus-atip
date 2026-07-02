---
type: ontology_edges
status: recorded
project: Red-Team-Studio
task: RedTeam AX operating closure human review record and checklist package slice
created: 2026-07-03T02:20:12+09:00
---

# Ontology Edges

| source | relation | target | evidence |
|---|---|---|---|
| `OperatingClosureHumanReview` | reviews | `OperatingClosureSubmissionPackage` | `package_id` |
| `OperatingClosureHumanReview` | requires | `ClosureChecklist` | six checklist fields |
| `OperatingClosureHumanReview` | requires | `ApproverSignoff` | four matching signoffs |
| `OperatingClosureHumanReview` | records | `RuntimeBlockerDisposition` | `runtime_blocker_disposition` |
| `OperatingClosureHumanReview` | authorizes | `CloseOperatingPayload` | `approved_close_api_payload` |
| `CloseOperatingPayload` | executed_by | `SeparateHITLStep` | `requires_separate_close_execution=true` |