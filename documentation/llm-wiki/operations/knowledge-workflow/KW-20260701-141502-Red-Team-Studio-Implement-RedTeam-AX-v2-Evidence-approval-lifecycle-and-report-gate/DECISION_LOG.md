---
type: decision_log
task_id: KW-20260701-141502-Red-Team-Studio-Implement-RedTeam-AX-v2-Evidence-approval-lifecycle-and-report-gate
project: Red Team Studio
task: Implement RedTeam AX v2 Evidence approval lifecycle and report gate
created: 2026-07-01T14:15:02+09:00
---

# Decision Log

| time | decision | alternatives | reason | evidence |
|---|---|---|---|---|
|  |  |  |  |  |
## Decision Log

- D-001: New EvidenceCard default is `approval_status=pending_review` and `validation_status=candidate`.
- D-002: Evidence approval sets both `approval_status=approved` and `validation_status=approved`.
- D-003: Report validation blocks missing, unapproved, and unverified Evidence separately.
- D-004: Report export gate reuses validation snapshot counts rather than trusting an earlier pass claim.
