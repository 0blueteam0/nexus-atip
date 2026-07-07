---
type: scope
task_id: KW-20260707-100314-Red-Team-Studio-Continue-RedTeam-AX-safe-smoke-candidate-operator-attestation-to-install-evidenc
project: Red-Team-Studio
task: Continue RedTeam AX safe smoke candidate operator attestation to install evidence registry
created: 2026-07-07T10:03:14+09:00
---

# Scope

## Objective

Add an operator attestation path that records safe local smoke version-only candidates into the install evidence registry while preserving that the command was API-executed and does not unlock scanner execution.

## Included

- Backend attestation API for safe smoke install evidence candidates.
- Registry row fields that show API-executed source and operator attestation.
- RedTeam2 admin button to record the first ready candidate after human review.
- Backend regression for candidate attestation safety properties.
- Frontend runtime readiness contract and plan updates.

## Excluded

- No active scan execution.
- No automatic evidence registration without operator attestation.
- No scanner runner unlock.
- No Finding/Claim/Report promotion or completion gate satisfaction.
