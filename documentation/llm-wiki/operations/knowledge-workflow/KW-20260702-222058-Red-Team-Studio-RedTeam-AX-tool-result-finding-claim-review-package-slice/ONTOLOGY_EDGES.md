---
type: ontology_edges
status: draft
project: Red Team Studio
created: 2026-07-02T22:20:58+09:00
---

# Ontology Edges

## Nodes

- RedTeamAX.ToolResultAnalysisBrief
- RedTeamAX.ToolResultFindingClaimReview
- RedTeamAX.EvidenceCard
- RedTeamAX.FindingDraft
- RedTeamAX.ClaimCandidate
- RedTeamAX.RuntimeReadiness
- RedTeamAX.AcceptedGateManifest

## Edges

- ToolResultAnalysisBrief `feeds` ToolResultFindingClaimReview
- ToolResultFindingClaimReview `creates_candidate` FindingDraft
- ToolResultFindingClaimReview `creates_candidate` ClaimCandidate
- EvidenceCard `approves_or_holds` FindingDraft
- EvidenceCard `approves_or_holds` ClaimCandidate
- RuntimeReadiness `projects` ToolResultFindingClaimReview
- AcceptedGateManifest `validates` ToolResultFindingClaimReview

## Graph Notes

후보 생성은 승인 또는 보고서 삽입을 의미하지 않는다. `requires_human_validation=true`와 `hold_unsupported_claim` 상태가 있는 동안 FindingDraft와 ClaimCandidate는 보고서 근거가 아니라 검토 대기 객체다.

| subject | predicate | object | evidence_id | note |
|---|---|---|---|---|
|  |  |  |  |  |
