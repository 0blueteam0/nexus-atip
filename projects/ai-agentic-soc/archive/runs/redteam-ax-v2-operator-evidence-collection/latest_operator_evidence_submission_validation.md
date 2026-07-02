# RedTeam AX Operator Evidence Submission Validation

- status: `awaiting_operator_evidence_submission`
- expected_item_count: `5`
- submitted_item_count: `5`
- approved_item_count: `0`
- blocked_item_count: `5`

## Safety Boundary

- This validator reads local artifact files only.
- It does not execute Docker, WSL, scanner, MCP, or network commands.
- It validates artifact existence, SHA-256, expected status, and human review status.

## Items

### OEC-LRR-DOCKER-001

- artifact_path: ``
- artifact_status: `missing`
- expected_status: `passed`
- sha256_match: `False`
- review_status: `pending_human_review`
- errors: `artifact_path_missing`

### OEC-LRR-WSL-001

- artifact_path: ``
- artifact_status: `missing`
- expected_status: `ready`
- sha256_match: `False`
- review_status: `pending_human_review`
- errors: `artifact_path_missing`

### OEC-LRR-SCANNER-ENDPOINT-001

- artifact_path: ``
- artifact_status: `missing`
- expected_status: `ready`
- sha256_match: `False`
- review_status: `pending_human_review`
- errors: `artifact_path_missing`

### OEC-LRR-SCANNER-IMPORT-001

- artifact_path: ``
- artifact_status: `missing`
- expected_status: `passed`
- sha256_match: `False`
- review_status: `pending_human_review`
- errors: `artifact_path_missing`

### OEC-LRR-PROMOTION-001

- artifact_path: ``
- artifact_status: `missing`
- expected_status: `promotion_ready`
- sha256_match: `False`
- review_status: `pending_human_review`
- errors: `artifact_path_missing`
