# Decisions

- Do not change the existing operator-executed version evidence API because its semantics are already clear and tested.
- Add a new attestation endpoint for safe smoke candidates so API-executed output is not falsely described as operator-executed.
- Reuse the install evidence registry because users need one coverage view for Nuclei, OpenVAS, Trivy, SCA, npm audit, and OWASP ZAP.
- Add explicit source flags to registry rows so audits can distinguish operator-entered evidence from operator-attested API safe smoke evidence.
- Keep `trusted_as_instruction=false` and `runner_unlocks=[]` in the recorded evidence.
- Put the frontend action behind admin details because evidence attestation is a controlled review action.
