---
type: scope
task_id: KW-20260701-124542-Red-Team-Studio-Persist-RedTeam-AX-v2-ToolAction-Evidence-and-Korean-Report-artifacts
project: Red Team Studio
task: Persist RedTeam AX v2 ToolAction Evidence and Korean Report artifacts
created: 2026-07-01T12:45:42+09:00
---

# Scope

## Included

- Add append-only case artifact storage under `archive/runs/redteam-ax-v2/{case_id}`.
- Persist ToolActionCard, ROE evaluation, ManualRunRecord, EvidenceCard, ReportValidationResult, and generated report JSON.
- Generate Korean Red Team Report v2 Markdown with document control, Campaign Walkthrough, Evidence Card Index, Claim-Evidence Matrix, Findings, Report Gate, and retest plan sections.
- Extend sample E2E to verify artifact paths and Markdown content.

## Excluded

- Human approval export route.
- Full UI reload from backend persistence.
- Full starter-pack regression.

## Completion Definition

This slice is complete when code, tests, live report artifact verification, plan update, and knowledge workflow close all pass.
