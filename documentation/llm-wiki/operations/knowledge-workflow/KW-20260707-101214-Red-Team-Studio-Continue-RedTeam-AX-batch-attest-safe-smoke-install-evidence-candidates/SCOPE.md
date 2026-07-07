---
type: scope
task_id: KW-20260707-101214-Red-Team-Studio-Continue-RedTeam-AX-batch-attest-safe-smoke-install-evidence-candidates
project: Red-Team-Studio
task: Continue RedTeam AX batch attest safe smoke install evidence candidates
created: 2026-07-07T10:12:14+09:00
---

# Scope

## Objective

Allow multiple safe local smoke version-only install evidence candidates to be operator-reviewed and recorded into the install evidence registry in one controlled action.

## Included

- Backend batch attestation API.
- Router endpoint for batch candidate attestation.
- Backend regression for recording multiple candidates.
- RedTeam2 admin button changed from first-candidate recording to all ready candidates.
- Frontend runtime contract and plan updates.

## Excluded

- No active scan execution.
- No SCA import-only evidence completion.
- No scanner runner unlock.
- No Finding/Claim/Report/export/completion gate satisfaction.
