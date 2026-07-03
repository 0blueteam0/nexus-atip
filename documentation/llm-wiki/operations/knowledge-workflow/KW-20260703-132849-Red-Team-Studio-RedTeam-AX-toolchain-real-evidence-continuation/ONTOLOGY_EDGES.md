# Ontology Edges

- RedTeam2 -> calls -> `/api/redteam/v2/toolchains/launch-readiness`
- LaunchReadiness -> classifies -> RequiredAnalysisTool
- RequiredAnalysisTool -> includes -> Nuclei, OpenVAS, Trivy, SCA, npm audit, OWASP ZAP
- LaunchReadinessRow -> exposes -> button_label_ko, can_execute_now, blocked_reasons, primary_api
- LaunchReadiness -> does_not_replace -> EvidenceApproval, FindingSeverityApproval, ReportExportGate, CompletionGate