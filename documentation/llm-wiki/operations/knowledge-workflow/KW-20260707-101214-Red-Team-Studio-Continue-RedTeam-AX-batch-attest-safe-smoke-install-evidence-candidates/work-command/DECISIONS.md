# Decisions

- Batch attestation is additive; the single candidate endpoint remains available.
- Each batch item is validated by the existing single-candidate function to keep one safety policy.
- RedTeam2 sends only `candidate_ready` rows, not missing stdout rows.
- The UI label includes the count so operators see the action scope before clicking.
- Batch records still identify outputs as API-executed and operator-attested; they are not operator-executed commands.
- Batch success does not prove SCA or full six-tool analysis completion.
