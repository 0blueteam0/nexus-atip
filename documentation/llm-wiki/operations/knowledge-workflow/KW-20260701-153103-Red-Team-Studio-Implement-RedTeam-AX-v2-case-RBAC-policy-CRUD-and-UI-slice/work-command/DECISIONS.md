---
type: work_command_record
task_id: KW-20260701-153103-Red-Team-Studio-Implement-RedTeam-AX-v2-case-RBAC-policy-CRUD-and-UI-slice
project: Red Team Studio
task: Implement RedTeam AX v2 case RBAC policy CRUD and UI slice
created: 2026-07-01T15:31:03+09:00
updated: 2026-07-01T16:25:00+09:00
source_package: K:/wiki/work command
---

# DECISIONS

## Ledger

| id | decision | alternatives | reason | impact |
|---|---|---|---|---|
| DEC-001 | Store case policy as `case-rbac/case-rbac-policy.json` artifact | Hard-coded registry only; introduce DB | Matches existing artifact evidence model and avoids new migration in this slice | Case policy is durable and auditable |
| DEC-002 | Active artifact overrides local case registry | Merge both sources | Case operator intent should be authoritative for the case once a policy is active | Approval context reflects latest case assignment |
| DEC-003 | Actor context records `case_policy_source` using shared helper | Leave fixed `local_case_assignment_registry` | Approval evidence must identify the policy source used | Live smoke confirms `case_policy_artifact` |
| DEC-004 | UI supports Load/Apply/Add now; delete UI later | Full grid editor now | Keeps slice narrow while backend DELETE is tested | Admin can seed and extend policy; row delete remains follow-up |

## Entries

The key architectural constraint is evidence-grade auditability. RBAC changes are therefore treated as case artifacts, not invisible in-memory state.
