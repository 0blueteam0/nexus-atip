# Ontology Edges

- Bandit -> implements -> python_static_security_scan
- TOOL-BANDIT-001 -> has_preset -> PRESET-BANDIT-PYTHON-SAFE-HELPER
- TOOL-BANDIT-001 -> uses_normalizer -> NORMALIZER-BANDIT-001
- TOOL-BANDIT-001 -> analyzed_by -> AGENT-BANDIT-ANALYST-001
- PRESET-BANDIT-PYTHON-SAFE-HELPER -> produces -> python_static_security_observation
- python_static_security_observation -> requires -> human_validation
- Python source text -> classified_as -> untrusted_tool_input
