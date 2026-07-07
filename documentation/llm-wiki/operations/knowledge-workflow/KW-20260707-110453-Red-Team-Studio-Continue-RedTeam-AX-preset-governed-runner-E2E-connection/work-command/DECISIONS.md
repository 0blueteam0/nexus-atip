# Decisions

- Store `runner_steps` as JSON instead of relying only on command-line text.
- Keep manual command text as fallback for administrator workflows.
- Validate the API contract by using the actual `execution-presets` response as `execute-governed` input.
- Do not claim full RedTeam AX completion from this narrow regression.
