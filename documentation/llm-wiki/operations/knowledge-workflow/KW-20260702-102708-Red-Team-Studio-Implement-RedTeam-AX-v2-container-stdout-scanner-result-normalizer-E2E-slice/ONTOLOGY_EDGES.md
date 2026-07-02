---
type: ontology_edges
status: draft
project: Red-Team-Studio
created: 2026-07-02T10:27:08+09:00
---

# Ontology Edges

| subject | predicate | object | evidence_id | note |
|---|---|---|---|---|
|  |  |  |  |  |

# Ontology Edges

- ContainerLaunchPrepared -> emits -> container_launch_plan_artifact
- ContainerLaunchPrepared -> emits -> stdout_artifact
- stdout_artifact -> parsed_by -> trivy_json_parser
- container_launch_plan_artifact -> parsed_by -> container_launch_plan_parser
- normalized_result -> contains -> container_launch_evidence
- normalized_result -> contains -> sca_vulnerability_candidate
- sca_vulnerability_candidate -> requires -> human_validation
- combined_normalized_result -> creates -> EvidenceCardCandidate
