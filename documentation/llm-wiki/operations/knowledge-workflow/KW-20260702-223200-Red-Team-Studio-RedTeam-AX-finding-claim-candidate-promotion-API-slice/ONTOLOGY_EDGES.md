---
type: ontology_edges
status: draft
project: Red Team Studio
created: 2026-07-02T22:32:00+09:00
---

# Ontology Edges

## Nodes

- RedTeamAX.ToolResultFindingClaimReview
- RedTeamAX.PromoteFindingAPI
- RedTeamAX.EvidenceStore
- RedTeamAX.FindingDraft
- RedTeamAX.ReportClaim
- RedTeamAX.AcceptedGateManifest

## Edges

- ToolResultFindingClaimReview `feeds` PromoteFindingAPI
- PromoteFindingAPI `checks` EvidenceStore
- PromoteFindingAPI `creates_when_approved` FindingDraft
- PromoteFindingAPI `does_not_insert` ReportClaim
- AcceptedGateManifest `validates` PromoteFindingAPI

| subject | predicate | object | evidence_id | note |
|---|---|---|---|---|
|  |  |  |  |  |
