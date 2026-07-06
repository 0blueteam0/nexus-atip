---
type: work_command_record
task_id: KW-20260706-122434-Red-Team-Studio-Continue-RedTeam-AX-goal-browser-verify-and-simplify-RedTeam2-analyst-workflow
project: Red-Team-Studio
task: Continue RedTeam AX goal: browser-verify and simplify RedTeam2 analyst workflow
created: 2026-07-06T12:24:34+09:00
source_package: K:/wiki/work command
---

# SOURCE_QUALITY

## Source Classification

| source | source_content_class | usable_for | reason | required_follow_up |
|---|---|---|---|---|
| `reports.js` | source code | RedTeam2 UI behavior | contains actual render logic and admin toggle | keep syntax and browser checks |
| Playwright DOM artifact | browser evidence | default visible UI claim | collected from running localhost app | rerun after UI changes |
| sanity scripts | regression evidence | static frontend contracts | repository-local checks for required copy and forbidden terms | update anchors when UI wording changes |
| completion audit matrix | governance record | requirement tracking | stores RTA-COMP statuses and evidence refs | keep active until all gaps are closed |

## Promotion Rule

A source can support a checklist requirement only when it contains actual requirement, procedure, record, control, or evaluation content. Purchase pages, catalog pages, abstracts, and search result metadata are not enough.

## Downgrade Rule

If a source is purchase-only, abstract-only, or search-result-only, record it as discovery evidence only. Do not use it as direct compliance evidence.
