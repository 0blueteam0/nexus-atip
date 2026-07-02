---
type: ontology_edges
status: draft
project: Red Team Studio
created: 2026-07-03T04:15:22+09:00
---

# Ontology Edges

| subject | predicate | object | evidence_id | note |
|---|---|---|---|---|
| CycloneDXComponent | becomes | SCAComponentInventoryEvidence | EU-REDTEAM-AX-SCA-CYCLONEDX-20260703 | Component refs, purl, version, license, supplier preserved. |
| SCAVulnerabilityCandidate | affects | SCAComponentInventoryEvidence | EU-REDTEAM-AX-SCA-CYCLONEDX-20260703 | `affected_component_refs` and `affected_components` link vulnerability to component. |
| SCAVulnerabilityCandidate | requires | HumanComponentMatchReview | EU-REDTEAM-AX-SCA-CYCLONEDX-20260703 | `requires_component_match_review=true` blocks premature Claim certainty. |
