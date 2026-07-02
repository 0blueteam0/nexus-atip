---
type: work_command_record
task_id: KW-20260702-101527-Red-Team-Studio-Implement-RedTeam-AX-v2-ephemeral-container-launcher-gated-dry-run-slice
project: Red-Team-Studio
task: Implement RedTeam AX v2 ephemeral container launcher gated dry-run slice
created: 2026-07-02T10:15:27+09:00
source_package: K:/wiki/work command
---

# DECISIONS

## Ledger

| id | decision | alternatives | reason | impact |
|---|---|---|---|---|

## Entries

# Decisions

- Keep `local_subprocess_shim` for existing dry-run regression.
- Use `ephemeral_container` only when selected in the execution plan.
- For container backend, bypass host wrapper pin requirement and rely on pinned image digest.
- Use dry-run mode for automated tests to avoid invoking Docker/Podman.
- Store the constructed container argv as JSON evidence.
- Do not mark full container isolation complete until real runtime smoke and egress checks exist.
