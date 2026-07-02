# RedTeam AX Operator Evidence Card Import Plan

- status: `awaiting_approved_operator_evidence`
- case_id: `CASE-V2-LIVE-READINESS-PROMOTION`
- candidate_count: `0`
- blocked_item_count: `5`

## Safety Boundary

- This plan does not create Evidence Cards automatically.
- It does not execute Docker, WSL, scanner, MCP, or network commands.
- Each candidate must be reviewed before calling the Evidence Card API.

## Evidence Card Candidates

- No approved operator evidence is ready for Evidence Card import.

## Blocked Items

- `OEC-LRR-DOCKER-001`: artifact_path_missing
- `OEC-LRR-WSL-001`: artifact_path_missing
- `OEC-LRR-SCANNER-ENDPOINT-001`: artifact_path_missing
- `OEC-LRR-SCANNER-IMPORT-001`: artifact_path_missing
- `OEC-LRR-PROMOTION-001`: artifact_path_missing
