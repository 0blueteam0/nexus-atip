---
type: work_command_record
task_id: KW-20260702-223200-Red-Team-Studio-RedTeam-AX-finding-claim-candidate-promotion-API-slice
project: Red Team Studio
task: RedTeam AX finding claim candidate promotion API slice
created: 2026-07-02T22:32:00+09:00
source_package: K:/wiki/work command
---

# TASKS

## Original Request

## Task

## Status

## Execution Control

## Tools

## Verification

## Completed Work

- Added read-only latest Finding/Claim review API.
- Added per-candidate `promote-finding` API.
- Reused existing Finding creation and Evidence approval checks.
- Blocked unapproved promotion with `finding_created=false`.
- Added API tests for list, blocked promotion, and approved-evidence promotion.
- Added Korean UI copy and frontend contracts for the new API path.
- Updated FINAL_PLAN, Detailed_PLAN, LLM Wiki, and completion audit.

## Deferred Work

- Promote all real candidates after real Evidence Card approval.
- Complete two-person severity approval for each promoted Finding.
- Insert report claims only after Claim-Evidence Matrix validation.
- Resolve Docker/WSL/OpenVAS/ZAP endpoint readiness blockers.
