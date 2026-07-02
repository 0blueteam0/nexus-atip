---
type: tool_decision
project: Red Team Studio
task: RedTeam AX next completion blocker reduction slice
---

# Tool Decision

## Selected Path

Implement a frontend visibility slice with contract tests, not an external runtime remediation attempt.

## Reason

The remaining readiness blockers are external system state. Starting Docker/WSL or probing OpenVAS/ZAP endpoints would require operator-controlled environment changes and explicit network/credential readiness. A UI step visibility slice still advances the goal by making the operator runbook actionable for Korean non-expert users.

## Tools

| tool | purpose |
|---|---|
| apply_patch | Scoped source and documentation edits |
| node --check | JavaScript syntax validation |
| Python sanity scripts | Frontend and audit contracts |
| accepted gate manifest | Regression verification |

## Rejected

- Auto-start Docker/WSL: external mutation and not safe to claim.
- Auto-call OpenVAS/ZAP: endpoint/vault envs absent and network checks need controlled approval.
- Completion claim: RTA-COMP-015 remains partial.
