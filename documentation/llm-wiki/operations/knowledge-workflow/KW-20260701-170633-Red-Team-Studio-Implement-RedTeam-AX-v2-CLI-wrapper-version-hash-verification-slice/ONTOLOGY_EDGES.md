---
type: ontology_edges
status: draft
project: Red-Team-Studio
created: 2026-07-01T17:06:33+09:00
---

# Ontology Edges

| subject | predicate | object | evidence_id | note |
|---|---|---|---|---|
| ToolProfile | has_wrapper_manifest | ToolWrapperManifest | EU-wrapper-manifest | `tool_wrapper_manifest_for_profile` |
| ToolWrapperManifest | reports | command_availability | EU-wrapper-manifest | `availability` field |
| ToolWrapperManifest | reports | sha256_pinning_status | EU-wrapper-manifest | `pinning_status` field |
| ToolExecutionPlan | includes | wrapper_preflight | EU-wrapper-manifest | `wrapper_preflight` field |
| RedTeam2ReportStudio | displays | ToolWrapperManifest | EU-wrapper-manifest | `Tool Wrapper Manifest / Version Pinning` panel |
| CLIWrapper | requires_before_runner_trust | expected_sha256_pin | EU-wrapper-manifest | `requires_pin_before_runner` |

