---
type: decision_log
task_id: KW-20260702-233157-Red-Team-Studio-RedTeam-AX-approved-Evidence-promotion-gate-continuation-slice
project: Red Team Studio
task: RedTeam AX approved Evidence promotion gate continuation slice
created: 2026-07-02T23:31:57+09:00
---

# Decision Log

| time | decision | alternatives | reason | evidence |
|---|---|---|---|---|
| 2026-07-02T23:40:00+09:00 | Add collection-specific `/promote-findings` endpoint | Reuse only static finding/claim review promotion | Dynamic toolchain collection Evidence needs a direct governed next step | EV-001, EV-002 |
| 2026-07-02T23:41:00+09:00 | Keep generated Findings in `pending_review` | Auto-approve severity | Final severity requires red_team_lead and business_owner approvals | EV-003 |
| 2026-07-02T23:42:00+09:00 | Add Korean UI controls after Evidence approval | Leave API-only | Operators need a visible next step and blocker explanation | EV-004, EV-005, EV-006 |
