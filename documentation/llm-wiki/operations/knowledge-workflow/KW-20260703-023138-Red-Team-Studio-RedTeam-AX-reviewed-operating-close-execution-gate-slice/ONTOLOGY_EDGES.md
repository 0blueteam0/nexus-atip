---
type: ontology_edges
status: recorded
project: Red-Team-Studio
task: RedTeam AX reviewed operating close execution gate slice
created: 2026-07-03T02:31:38+09:00
---

# Ontology Edges

| source | relation | target | evidence |
|---|---|---|---|
| `ReviewedOperatingCloseExecution` | requires | `OperatingClosureHumanReview` | `review_id` |
| `ReviewedOperatingCloseExecution` | uses_only | `approved_close_api_payload` | backend wrapper |
| `ReviewedOperatingCloseExecution` | refuses | `override_close_api_payload` | regression warning |
| `ReviewedOperatingCloseExecution` | invokes | `CloseOperatingArtifactManifestE2E` | close_result |