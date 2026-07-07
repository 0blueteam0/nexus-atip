# Reviews

## Self Review

- Confirmed the new attestation path requires operator identity, role, review note, and explicit `operator_attests_output_matches_artifact=true`.
- Confirmed invalid candidates are rejected when they are not API-executed, are trusted as instruction, do not require attestation, or unlock runners.
- Confirmed recorded evidence preserves `version_command_executed_by_operator=false` and `commands_executed_by_api=true`.
- Confirmed registry listing itself still does not execute commands.
- Confirmed frontend button is disabled until a `candidate_ready` item exists.

## Verification Review

All selected checks passed. The backend test mocks subprocess execution, so no real scanner or active scan was launched.
