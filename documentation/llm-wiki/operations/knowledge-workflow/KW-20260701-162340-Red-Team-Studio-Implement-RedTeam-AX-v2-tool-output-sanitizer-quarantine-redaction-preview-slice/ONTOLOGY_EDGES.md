---
type: ontology_edges
status: draft
project: Red-Team-Studio
created: 2026-07-01T16:23:40+09:00
---

# Ontology Edges

| subject | predicate | object | evidence_id | note |
|---|---|---|---|---|
|  |  |  |  |  |

# Ontology Edges

- `ToolRunRecord` -> `hasSanitizerPreview` -> `ToolOutputSanitizerPreview`
- `ToolOutputSanitizerPreview` -> `detects` -> `PromptInjectionIndicator`
- `ToolOutputSanitizerPreview` -> `redacts` -> `SecretIndicator`
- `PromptInjectionIndicator` -> `causesDecision` -> `quarantine`
- `SecretIndicator` -> `causesDecision` -> `redact`
- `ToolOutputSanitizer` -> `protects` -> `LLMAnalysisAgent`
