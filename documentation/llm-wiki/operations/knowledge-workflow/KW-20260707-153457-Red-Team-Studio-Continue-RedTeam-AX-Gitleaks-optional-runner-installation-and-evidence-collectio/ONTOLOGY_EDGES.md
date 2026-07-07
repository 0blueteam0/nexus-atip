# Ontology Edges

- Gitleaks -> implements -> secret_exposure_scan
- TOOL-GITLEAKS-001 -> has_preset -> PRESET-GITLEAKS-WORKSPACE-REDACTED-JSON
- TOOL-GITLEAKS-001 -> uses_normalizer -> NORMALIZER-GITLEAKS-001
- TOOL-GITLEAKS-001 -> analyzed_by -> AGENT-GITLEAKS-ANALYST-001
- PRESET-GITLEAKS-WORKSPACE-REDACTED-JSON -> produces -> secret_exposure_candidate
- secret_exposure_candidate -> requires -> human_validation
- secret_value -> must_not_be_stored_in -> Evidence Card
