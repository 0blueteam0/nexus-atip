---
type: ontology_edges
status: draft
project: Red Team Studio
created: 2026-07-01T15:17:02+09:00
---

# Ontology Edges

| subject | predicate | object | evidence_id | note |
|---|---|---|---|---|
|  |  |  |  |  |

# Ontology edges

- `ActorContextProvider` -- `resolves` --> `ActorContext`
- `ActorContext` -- `has_role` --> `ApproverRole`
- `ApproverRole` -- `grants` --> `Permission`
- `ApprovalDecision` -- `requires` --> `authenticated ActorContext`
- `ToolActionApproval` -- `uses` --> `ActorContextProvider`
- `EvidenceApproval` -- `uses` --> `ActorContextProvider`
- `FindingSeverityApproval` -- `uses` --> `ActorContextProvider`
- `ReportExportApproval` -- `uses` --> `ActorContextProvider`
- `ExternalSSOProvider` -- `future_adapter_for` --> `ActorContextProvider`
