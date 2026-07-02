# Decisions

- Use a dedicated `/api/redteam/v2/toolchains/import-artifact-manifest` endpoint for file-based operating outputs.
- Require `requested_by` and at least two artifacts to avoid unaudited single-file shortcuts.
- Validate registered ToolProfile and create/reuse ToolActionCard + offline_parse ExecutionPlan before importing a file.
- Reuse existing file import logic so source path and SHA-256 checks stay centralized.
- Keep scanner command execution, active scan, shell expansion, and raw-output instruction trust explicitly false.
- Treat bad hashes as blocked step evidence, not silent failure.
