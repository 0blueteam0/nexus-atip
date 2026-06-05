# Tooling

| tool | purpose | command_or_use | result | impact |
|---|---|---|---|---|
| `skill_view` | planning procedure | `skill_view(name='writing-plans')` | planning skill loaded | Scope artifact follows implementation planning conventions |
| `session_search` | prior conversation retrieval | Korean/English FDS mass-test queries | no direct narrow matches | Forced use of durable repository evidence |
| `search_files` | durable artifact discovery | FDS handoff/report/test searches | found FDS handoffs, v4 docs, tests | Restored previous work context |
| `read_file` | evidence inspection | exact-coordinate, real-image redteam, collector, policy docs | relevant requirements read | Prevented scope from contradicting prior work |
| `pytest --durations` | current test baseline | full glob and older four-file bundle | glob failed; subset 16 passed in 47.61s | Grounded Workstream B in real outputs |
| `write_file` | artifact creation | scope report and workflow files | files written | Durable source of truth created |
| `knowledge_workflow.py close` | evidence gate | close current session | initially failed, then files were being supplemented | Prevents claiming completion without gate |

Tooling rule for next execution:

- Use `pytest --durations` for every test-harness change.
- Use file-level searches before recreating missing scripts.
- Use source/provenance manifests before promoting web candidates.
- Do not use visual inspection alone to approve privacy-sensitive data.
