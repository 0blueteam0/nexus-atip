# Decision Log

- Decision: Require all six default tool IDs in close_operating_toolchain_artifact_manifest_e2e when require_all_named_tools is true.
- Reason: The final operating closure lane must not be weaker than readiness preflight.
- Safety: The API still only reads existing artifacts and does not run scanner, Docker, WSL, network scan, active scan, or shell expansion.
- Residual risk: This proves the contract with fixtures, not real organization scanner artifacts or real approver identities.
