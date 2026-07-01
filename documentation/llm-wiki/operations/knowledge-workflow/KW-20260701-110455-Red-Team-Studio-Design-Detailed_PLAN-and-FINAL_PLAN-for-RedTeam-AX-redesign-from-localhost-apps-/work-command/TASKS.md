---
type: work_command_record
task_id: KW-20260701-110455-Red-Team-Studio-Design-Detailed_PLAN-and-FINAL_PLAN-for-RedTeam-AX-redesign-from-localhost-apps-
project: Red Team Studio
task: Design Detailed_PLAN and FINAL_PLAN for RedTeam AX redesign from localhost apps, chatshare, and full folder inventory
created: 2026-07-01T11:04:55+09:00
source_package: K:/wiki/work command
---

# TASKS

## Original Request

## Task

## Status

## Execution Control

## Tools

## Verification

## Filled Task Record

Completed:

- Extracted ChatGPT Red Team process share with ChatShare Artifact Lab.
- Generated Red Team Studio full file manifest and summaries.
- Created `Detailed_PLAN.MD`, `FINAL_PLAN.md`, `LLM_WIKI_HOME.md`.
- Created `고도화/sanity/test_plan_contract.py`.
- Validated plan contract and ChatShare handoff files.

Next:

1. Commit and push M0 planning artifacts.
2. Implement frontend M1: add `redteam2` tab and isolated state.
3. Implement backend M2: `/api/redteam/v2` skeleton.
4. Start ports 5177/8765 and run live UI/API smoke.

Acceptance:

- Existing `redteam` remains unchanged.
- `redteam2` is visible beside `redteam`.
- T5/direct MCP/high-risk action remains deny-by-default.

