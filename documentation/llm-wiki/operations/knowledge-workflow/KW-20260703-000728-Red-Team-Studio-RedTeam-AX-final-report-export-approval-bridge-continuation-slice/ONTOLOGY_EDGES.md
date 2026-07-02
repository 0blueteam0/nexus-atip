---
type: knowledge_workflow_record
project: Red Team Studio
task: RedTeam AX final report export approval bridge continuation slice
---

# ONTOLOGY_EDGES

- ToolchainCollectionReportDraft -> produces -> ReportV2Draft
- ReportV2Draft -> requires -> ReportExportApproval
- ReportExportApproval -> requires -> ExecutiveSponsor
- ReportExportApproval -> verifies -> ReportGateSnapshot
- ReportExport -> produces -> ExportArtifact
- RedTeam2UI -> connects -> ToolchainCollectionReportDraftToFinalGate
