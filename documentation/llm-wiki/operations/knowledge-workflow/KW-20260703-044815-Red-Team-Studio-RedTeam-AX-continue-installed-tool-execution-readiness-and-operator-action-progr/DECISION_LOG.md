# Decision Log

- Decision: Add runtime next_action_plan directly to the read-only runtime-readiness API.
- Reason: The frontend already consumes this API for execution readiness visibility, so it is the right contract point for operator guidance.
- Safety: The API still only reads readiness artifacts and returns commands_executed_by_api=false, active_scan_executed=false, trusted_as_instruction=false.
- Residual gap: This is guidance and contract proof, not real Docker/WSL/OpenVAS/ZAP readiness or real six-tool E2E completion proof.
