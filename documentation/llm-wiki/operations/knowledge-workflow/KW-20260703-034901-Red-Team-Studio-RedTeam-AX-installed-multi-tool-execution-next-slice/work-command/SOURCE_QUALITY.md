---
type: work_command_record
task_id: KW-20260703-034901-Red-Team-Studio-RedTeam-AX-installed-multi-tool-execution-next-slice
project: Red Team Studio
task: RedTeam AX installed multi-tool execution next slice
created: 2026-07-03T03:49:01+09:00
source_package: K:/wiki/work command
---

# SOURCE_QUALITY

## Source Classification

| source | source_content_class | usable_for | reason | required_follow_up |
|---|---|---|---|---|
| `runtime/redteam_v2_models.py` | implementation source | API behavior evidence | Contains progress contract fields | Re-test when execution flow changes |
| `tests/test_redteam_v2_api_router.py` | regression source | Coverage evidence | Asserts Korean progress and 100% completion for multi-tool run | Extend for real tool smoke when environment ready |
| `reports.js` | frontend source | UI copy/render evidence | Renders progress and next-action rows | Browser screenshot optional in later UI pass |

## Promotion Rule

A source can support a checklist requirement only when it contains actual requirement, procedure, record, control, or evaluation content. Purchase pages, catalog pages, abstracts, and search result metadata are not enough.

## Downgrade Rule

If a source is purchase-only, abstract-only, or search-result-only, record it as discovery evidence only. Do not use it as direct compliance evidence.
