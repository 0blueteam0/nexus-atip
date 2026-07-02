---
type: ontology_edges
status: draft
project: Red-Team-Studio
created: 2026-07-02T10:21:44+09:00
---

# Ontology Edges

| subject | predicate | object | evidence_id | note |
|---|---|---|---|---|
|  |  |  |  |  |

# Ontology Edges

- ContainerLaunchPrepared -> emits -> container_launch_plan_artifact
- container_launch_plan_artifact -> parsed_as -> container_launch_evidence
- container_launch_evidence -> has_property -> trusted_as_instruction_false
- container_launch_evidence -> requires -> human_validation
- normalized_result -> creates -> EvidenceCardCandidate
- EvidenceCardCandidate -> eligible_for -> ClaimEvidenceMatrix_after_approval
