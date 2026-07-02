---
type: ontology_edges
status: draft
project: Red Team Studio
created: 2026-07-03T04:00:39+09:00
---

# Ontology Edges

| subject | predicate | object | evidence_id | note |
|---|---|---|---|---|
| ToolchainResultCollection | exposes | AnalysisAgentSummary | EU-REDTEAM-AX-TOOLCHAIN-AGENT-SUMMARY-20260703 | Collection response includes top-level and per-step agent summaries. |
| AnalysisAgentSummary | constrains | EvidenceUseBeforeApproval | EU-REDTEAM-AX-TOOLCHAIN-AGENT-SUMMARY-20260703 | Summary repeats untrusted-data and approval-before-claim rule. |
| RedTeam2UI | renders | EvidenceUseLimitKoreanCopy | EU-REDTEAM-AX-TOOLCHAIN-AGENT-SUMMARY-20260703 | UI table shows Korean evidence-use limitation. |
