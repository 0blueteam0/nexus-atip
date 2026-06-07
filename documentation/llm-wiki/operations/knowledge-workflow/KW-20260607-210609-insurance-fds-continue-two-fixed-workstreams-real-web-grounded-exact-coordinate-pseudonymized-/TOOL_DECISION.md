# Tool Decision

| Tool | Why used | Result |
|---|---|---|
| `session_search` | Recover previous paused scope instead of guessing. | Found the two fixed insurance FDS workstreams and pause point. |
| `skill_view` | Load continuation/debugging/TDD procedures. | Loaded task-ledger-continuity, systematic-debugging, test-driven-development. |
| `read_file` | Inspect scope report and failing tests. | Confirmed required behavior and policy constraints. |
| `search_files` | Check whether missing script existed elsewhere. | No `insurance_fds_real_image_field_inventory.py` existed. |
| `uvx pytest` | Use isolated pytest because active Hermes venv lacks pytest. | Reproduced failure and verified fix. |
| `write_file` / `patch` | Create the missing script and evidence files. | Script written and updated after first red/green cycle. |
| `handoff.ps1` | Cross-LLM handoff required for system/script change. | Provider/system handoff generated; system handoff enriched manually. |

## Dependency note

The active Hermes Python environment had no pytest. Rather than modifying the Hermes venv, verification used `uvx --from pytest` with per-run dependencies: `pillow`, `openpyxl`, `requests`.
