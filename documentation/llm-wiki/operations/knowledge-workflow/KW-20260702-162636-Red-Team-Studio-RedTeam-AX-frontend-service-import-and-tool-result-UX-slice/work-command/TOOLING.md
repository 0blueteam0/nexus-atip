---
type: work_command_record
task_id: KW-20260702-162636-Red-Team-Studio-RedTeam-AX-frontend-service-import-and-tool-result-UX-slice
project: Red Team Studio
task: RedTeam AX frontend service import and tool result UX slice
created: 2026-07-02T16:26:36+09:00
source_package: K:/wiki/work command
---

# TOOLING

## Tool Need

## Candidates

| candidate | type | benefit | risk | decision |
|---|---|---|---|---|

## Build vs Adopt

## Selected Tool

## Verification



## Autofill Work Command Evidence

Selected tool: `knowledge_workflow.py autofill`.
Tool need: non-blocking or low-friction evidence session closure.
Benefit: structured close files are generated from concise inputs.
Risk: bad inputs still produce weak evidence, so the close gate and human summary remain necessary.
Verification: run `python tools/knowledge_workflow.py autofill --close ...` and inspect `QUALITY_GATE_RESULT.json`.
