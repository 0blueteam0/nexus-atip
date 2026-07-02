---
type: ontology_edges
status: draft
project: Red-Team-Studio
created: 2026-07-02T10:15:27+09:00
---

# Ontology Edges

| subject | predicate | object | evidence_id | note |
|---|---|---|---|---|
|  |  |  |  |  |

# Ontology Edges

- ToolExecutionPlan -> issues -> execution_token
- execution_token -> authorizes -> governed_runner_attempt
- governed_runner_attempt -> branches_to -> ephemeral_container_launcher
- ephemeral_container_launcher -> requires -> image_digest_attestation
- ephemeral_container_launcher -> emits -> container_launch_plan_artifact
- container_launch_plan_artifact -> has_property -> trusted_as_instruction_false
- ephemeral_container_launcher -> enforces -> network_none
- ephemeral_container_launcher -> enforces -> read_only_workspace_mount
- ephemeral_container_launcher -> enforces -> dropped_capabilities
- ephemeral_container_launcher -> remains_pending -> real_runtime_smoke
