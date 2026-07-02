---
type: ontology_edges
status: recorded
project: Red-Team-Studio
task: RedTeam AX reviewed operating close evidence certification slice
created: 2026-07-03T02:39:31+09:00
---

# Ontology Edges

| source | relation | target | evidence |
|---|---|---|---|
| `ReviewedOperatingCloseEvidenceCertification` | certifies | `ReviewedOperatingCloseExecution` | `execution_id` |
| `ReviewedOperatingCloseEvidenceCertification` | requires | `RealOperatorAttestation` | five required fields |
| `ReviewedOperatingCloseEvidenceCertification` | feeds | `FinalCompletionAudit` | `ready_for_completion_audit_review` |
| `ReviewedOperatingCloseEvidenceCertification` | does_not_mark | `GoalComplete` | `does_not_mark_goal_complete=true` |