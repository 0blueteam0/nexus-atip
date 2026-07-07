# Decision Log

- Decision: store execution preset `runner_steps[]` in `compositeRunnerStepsJson`.
  - Reason: preserve backend-approved runner metadata and avoid reducing structured safety decisions to free-form strings.
- Decision: keep manual command lines as fallback.
  - Reason: existing operator workflow remains usable if the preset state is absent or intentionally edited by an administrator.
- Decision: add a backend regression that uses the exact preset response as execution input.
  - Reason: proves the frontend/backend contract intended by the user-visible button workflow.
- Decision: document remaining gaps explicitly.
  - Reason: this slice is progress toward the active goal, not proof of total RedTeam AX completion.
