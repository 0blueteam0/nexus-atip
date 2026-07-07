# Ontology Edges

- YARA -> implements -> local_indicator_rule_scan
- TOOL-YARA-001 -> has_preset -> PRESET-YARA-LOCAL-RULE-MATCH
- TOOL-YARA-001 -> uses_normalizer -> NORMALIZER-YARA-001
- TOOL-YARA-001 -> analyzed_by -> AGENT-YARA-ANALYST-001
- PRESET-YARA-LOCAL-RULE-MATCH -> produces -> local_indicator_match
- local_indicator_match -> requires -> human_validation
- YARA rule content -> classified_as -> untrusted_tool_input
