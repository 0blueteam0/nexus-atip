# Ontology Edges

- OperatingToolchainArtifactManifestE2EClosure -> composes -> ToolchainArtifactManifestBuilder
- OperatingToolchainArtifactManifestE2EClosure -> composes -> ToolchainArtifactManifestImport
- OperatingToolchainArtifactManifestE2EClosure -> composes -> ToolchainResultCollection
- OperatingToolchainArtifactManifestE2EClosure -> composes -> ToolchainCollectionE2EClosure
- ToolchainCollectionE2EClosure -> produces -> KoreanReportV2Export
- OperatingToolchainArtifactManifestE2EClosure -> preserves -> ScannerCommandNonExecutionInvariant
- RedTeam2Panel -> exposes -> OperatingToolchainArtifactManifestE2EClosure
