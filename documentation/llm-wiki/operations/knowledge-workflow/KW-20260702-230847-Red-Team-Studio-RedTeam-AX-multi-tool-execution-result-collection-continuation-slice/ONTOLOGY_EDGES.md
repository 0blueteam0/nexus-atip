# Ontology Edges

| subject | relation | object | evidence |
|---|---|---|---|
| GovernedToolchainExecution | produces | ToolRunRecord | `toolchains/execute-governed` |
| ToolchainResultCollection | reads | ToolRunRecord.raw_artifacts | `toolchains/{toolchain_id}/collect-results` |
| ToolchainResultCollection | invokes | ToolOutputSanitizer | `preview_tool_output_sanitizer` |
| ToolchainResultCollection | invokes | ToolResultNormalizerAgent | `agent_analyze_tool_run` |
| ToolchainResultCollection | creates | EvidenceCardCandidate | `create_evidence_from_tool_run` |
| EvidenceCardCandidate | requires | HumanApproval | RedTeam AX HITL policy |
