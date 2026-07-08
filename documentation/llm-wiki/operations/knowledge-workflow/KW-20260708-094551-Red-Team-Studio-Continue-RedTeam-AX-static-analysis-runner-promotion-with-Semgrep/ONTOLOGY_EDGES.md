---
type: ontology_edges
status: draft
project: Red Team Studio
created: 2026-07-08T09:45:51+09:00
---

# Ontology Edges

| subject | predicate | object | evidence_id | note |
|---|---|---|---|---|
|  |  |  |  |  |

# Ontology Edges

- `TOOL-SEMGREP-001` -> `implements` -> `SPEC/23_CUSTOM_SCRIPT_FACTORY_SPEC.md`
- `TOOL-SEMGREP-001` -> `uses_runtime` -> `고도화/tool-runtimes/semgrep_1.168.0_venv`
- `PRESET-SEMGREP-LOCAL-RULE-SAMPLE` -> `executes` -> `semgrep scan --quiet --config local_rule --json approved_file`
- `NORMALIZER-SEMGREP-001` -> `produces` -> `static_code_rule_observation`
- `AGENT-SEMGREP-ANALYST-001` -> `reviews` -> `Semgrep JSON`
- `Semgrep matched lines` -> `trusted_as` -> `data_only_never_instruction`
