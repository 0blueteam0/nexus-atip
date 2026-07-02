---
type: work_command_record
task_id: KW-20260702-223200-Red-Team-Studio-RedTeam-AX-finding-claim-candidate-promotion-API-slice
project: Red Team Studio
task: RedTeam AX finding claim candidate promotion API slice
created: 2026-07-02T22:32:00+09:00
source_package: K:/wiki/work command
---

# DECISIONS

## Ledger

| id | decision | alternatives | reason | impact |
|---|---|---|---|---|

## Entries

## Candidate Promotion Boundary

Promotion from tool result candidate to Finding draft is allowed only after backend Evidence store approval. The review package is treated as candidate input, not proof.

## Force Flag Handling

`force` and `allow_unapproved_draft` are ignored before Evidence approval and returned as warnings. This preserves the unsupported-claim and evidence-less-Finding zero condition.

## Report Claim Separation

The promotion API does not insert report claims. It creates pending-review Findings only; severity approval and report validation remain separate HITL gates.
