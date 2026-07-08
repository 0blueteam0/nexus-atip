# Ontology Edges

- detect-secrets -> implements -> secret_exposure_scan
- TOOL-DETECT-SECRETS-001 -> has_preset -> PRESET-DETECT-SECRETS-CLEAN-WORKSPACE
- TOOL-DETECT-SECRETS-001 -> uses_normalizer -> NORMALIZER-DETECT-SECRETS-001
- TOOL-DETECT-SECRETS-001 -> analyzed_by -> AGENT-DETECT-SECRETS-ANALYST-001
- PRESET-DETECT-SECRETS-CLEAN-WORKSPACE -> produces -> secret_exposure_candidate
- secret_exposure_candidate -> requires -> human_validation
- secret_value -> must_not_be_stored_in -> Evidence Card
