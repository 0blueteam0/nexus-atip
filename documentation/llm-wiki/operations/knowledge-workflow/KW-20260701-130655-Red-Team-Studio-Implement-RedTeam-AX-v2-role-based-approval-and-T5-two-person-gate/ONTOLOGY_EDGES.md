---
type: ontology_edges
status: draft
project: Red Team Studio
created: 2026-07-01T13:06:55+09:00
---

# Ontology Edges

## Candidate Nodes

- `ToolActionCard`
- `ApprovalPolicy`
- `ApproverRole`
- `ControlTeam`
- `SecondApprover`
- `ManualRunRecord`
- `CaseWorkspace`

## Candidate Edges

| subject | predicate | object | evidence |
|---|---|---|---|
| `T4ToolAction` | `requires_role` | `control_team` | `approval_policy_for` |
| `T5ToolAction` | `requires_roles` | `control_team + second_approver` | `approval_policy_for` |
| `T5ToolAction` | `requires_distinct_approvers` | `true` | API test/live smoke |
| `ManualRunRecord` | `requires` | `ToolActionCard` | `tool_action_card_required_before_manual_run` |
| `ManualRunRecord` | `blocked_until` | `ToolActionCard.status == Approved` | `approval_required_before_manual_run` |

| subject | predicate | object | evidence_id | note |
|---|---|---|---|---|
|  |  |  |  |  |

