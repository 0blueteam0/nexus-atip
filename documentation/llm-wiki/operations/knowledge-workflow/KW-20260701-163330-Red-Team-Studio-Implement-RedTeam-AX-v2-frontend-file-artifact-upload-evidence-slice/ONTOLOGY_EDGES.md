# Ontology Edges

- RedTeamAXv2 -> has_capability -> MultipartToolOutputUpload
- MultipartToolOutputUpload -> stores_in -> CaseWorkspaceUploadInbox
- CaseWorkspaceUploadInbox -> feeds -> StrictImportFilePolicy
- StrictImportFilePolicy -> verifies -> SHA256
- StrictImportFilePolicy -> emits -> ToolArtifactImport
- ToolArtifactImport -> validates_against -> ToolArtifactImportSchema
- ToolArtifactImport -> updates -> ToolRunRecord
- ToolRunRecord -> feeds -> ToolOutputSanitizerPreview
- ToolRunRecord -> feeds -> AgentAnalyzeNormalizer
- AgentAnalyzeNormalizer -> emits -> ToolResultNormalized
- ToolResultNormalized -> candidate_for -> EvidenceCard
