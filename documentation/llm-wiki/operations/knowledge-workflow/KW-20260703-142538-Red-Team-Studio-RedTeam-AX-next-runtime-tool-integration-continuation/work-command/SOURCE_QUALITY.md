---
type: work_command_record
task_id: KW-20260703-142538-Red-Team-Studio-RedTeam-AX-next-runtime-tool-integration-continuation
project: Red-Team-Studio
task: RedTeam AX next runtime tool integration continuation
created: 2026-07-03T14:25:38+09:00
source_package: K:/wiki/work command
---

# SOURCE_QUALITY

## Source Classification

| source | source_content_class | usable_for | reason | required_follow_up |
|---|---|---|---|---|

## Promotion Rule

A source can support a checklist requirement only when it contains actual requirement, procedure, record, control, or evaluation content. Purchase pages, catalog pages, abstracts, and search result metadata are not enough.

## Downgrade Rule

If a source is purchase-only, abstract-only, or search-result-only, record it as discovery evidence only. Do not use it as direct compliance evidence.

# Source Quality

| source | type | strength | limitation |
|---|---|---|---|
| `runtime/redteam_v2_models.py` | implementation | authoritative for local API behavior | not proof of live endpoint |
| `tests/test_redteam_v2_api_router.py` | regression | proves service import projection contract | uses raw report fixture |
| `reports.js` | frontend implementation | proves UI payload/state wiring | not browser-rendered in this slice |
| sanity scripts | static contract checks | proves expected anchors and copy | not full E2E browser test |
