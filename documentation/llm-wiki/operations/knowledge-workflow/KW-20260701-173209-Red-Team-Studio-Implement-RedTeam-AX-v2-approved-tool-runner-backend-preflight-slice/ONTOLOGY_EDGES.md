---
type: ontology_edges
status: draft
project: Red-Team-Studio
created: 2026-07-01T17:32:09+09:00
---

# Ontology Edges

## Filled Record

- RedTeamAXv2 `has_control` ExecutionToken
- ExecutionToken `authorizes` GovernedRunnerAttempt
- GovernedRunnerAttempt `requires` ToolExecutionPlan
- GovernedRunnerAttempt `requires` ToolWrapperManifest
- ToolWrapperManifest `requires` ApprovedWrapperPin
- GovernedRunnerAttempt `produces` RunnerOutputArtifact
- RunnerOutputArtifact `is_untrusted_input_to` ToolResultNormalizerAgent
- ToolResultNormalizerAgent `produces` EvidenceCandidate

| subject | predicate | object | evidence_id | note |
|---|---|---|---|---|
|  |  |  |  |  |

