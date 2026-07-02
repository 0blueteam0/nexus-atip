---
type: ontology_edges
status: draft
project: Red-Team-Studio
created: 2026-07-01T17:49:14+09:00
---

# Ontology Edges

| subject | predicate | object | evidence_id | note |
|---|---|---|---|---|
|  |  |  |  |  |

# Ontology Edges

- RedTeam AX v2 -> has_runner_backend -> local_subprocess_shim
- RedTeam AX v2 -> requires_runner_backend -> ephemeral_container
- ephemeral_container -> requires_control -> image_digest_pinned
- ephemeral_container -> requires_control -> network_deny_or_allowlist_enforced
- ephemeral_container -> requires_control -> workspace_read_only_mount
- ephemeral_container -> requires_control -> case_write_mount_only
- ephemeral_container -> requires_control -> ephemeral_cleanup_attested
- ToolExecutionPlan -> includes -> isolation_readiness
- isolation_readiness -> blocks -> execution_token
- runner_output -> becomes -> Evidence Card raw_artifact
- runner_output -> must_not_be -> trusted_instruction
