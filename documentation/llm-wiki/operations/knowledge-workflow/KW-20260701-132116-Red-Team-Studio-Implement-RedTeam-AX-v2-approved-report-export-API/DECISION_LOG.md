---
type: decision_log
task_id: KW-20260701-132116-Red-Team-Studio-Implement-RedTeam-AX-v2-approved-report-export-API
project: Red Team Studio
task: Implement RedTeam AX v2 approved report export API
created: 2026-07-01T13:21:16+09:00
---

# Decision Log

| time | decision | alternatives | reason | evidence |
|---|---|---|---|---|
|  |  |  |  |  |
## Decisions - Slice 7

- D-001: Use `executive_sponsor` as the required report export approval role, matching `SPEC/11_SECURITY_HITL_POLICY_SPEC.md`.
- D-002: Split final approval and export into two endpoints so approval evidence can be reviewed independently from export.
- D-003: Persist approval records under `report-export-approvals` and export manifests under `exports` in the case workspace.
- D-004: Keep export blocked if the report has no generated Markdown artifact, even if validation says pass.
