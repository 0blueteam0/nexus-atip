---
type: work_command_record
task_id: KW-20260702-115140-Red-Team-Studio-Implement-RedTeam-AX-v2-live-approval-grant-gate-smoke-slice
project: Red-Team-Studio
task: Implement RedTeam AX v2 live approval grant gate smoke slice
created: 2026-07-02T11:51:40+09:00
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
