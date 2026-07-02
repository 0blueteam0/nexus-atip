---
type: work_command_record
task_id: KW-20260703-033230-Red-Team-Studio-RedTeam-AX-next-operating-evidence-closure-slice
project: Red Team Studio
task: RedTeam AX next operating evidence closure slice
created: 2026-07-03T03:32:30+09:00
source_package: K:/wiki/work command
---

# SOURCE_QUALITY

## Source Classification

| source | source_content_class | usable_for | reason | required_follow_up |
|---|---|---|---|---|
| `runtime/redteam_v2_models.py` | implementation source | API behavior evidence | Contains import function and HITL checks | Re-verify after next model change |
| `tests/test_redteam_v2_api_router.py` | regression test source | Test coverage evidence | Covers create, approve, and blocked branches | Extend when Finding import is added |
| `latest_accepted_gate_manifest.json` | generated gate artifact | Current gate status | Records accepted gate count and pass/fail state | Regenerate after every slice |

## Promotion Rule

A source can support a checklist requirement only when it contains actual requirement, procedure, record, control, or evaluation content. Purchase pages, catalog pages, abstracts, and search result metadata are not enough.

## Downgrade Rule

If a source is purchase-only, abstract-only, or search-result-only, record it as discovery evidence only. Do not use it as direct compliance evidence.
