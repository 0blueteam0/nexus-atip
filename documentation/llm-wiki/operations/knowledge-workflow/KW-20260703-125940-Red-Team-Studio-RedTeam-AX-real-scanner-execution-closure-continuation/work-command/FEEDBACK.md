# Feedback

## User-Facing Note

The UI should show collection progress separately from completion readiness. A user can see “수집 완료” for two tools, but the same panel must also show that four required tools are missing and final completion is not ready.

## Product Feedback

RedTeam2 should add a small table based on `required_analysis_tool_coverage.rows` with Korean labels for present/missing tools, result id, Evidence id, and next action.

## Engineering Feedback

The completion gate should continue to consume `completion_gate_ready`, not only `status`.
