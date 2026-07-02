---
type: ontology_edges
status: recorded
project: Red-Team-Studio
task: RedTeam AX operating closure submission package and approver readiness slice
created: 2026-07-03T01:56:07+09:00
---

# Ontology Edges

| source | relation | target | evidence |
|---|---|---|---|
| `OperatingClosureSubmissionPackage` | validates | `source_dir` | API payload and regression test |
| `OperatingClosureSubmissionPackage` | requires | `EvidenceReviewer` | approver checks |
| `OperatingClosureSubmissionPackage` | requires | `RedTeamLeadApprover` | approver checks |
| `OperatingClosureSubmissionPackage` | requires | `BusinessOwnerApprover` | approver checks |
| `OperatingClosureSubmissionPackage` | requires | `ExportApprover` | approver checks |
| `OperatingClosureSubmissionPackage` | prepares | `CloseOperatingArtifactManifestE2EPayload` | response `close_api_payload` |
| `RuntimeReadinessBlocker` | reviewed_by | `HumanApprover` | submission items |