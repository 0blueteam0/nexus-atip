---
type: scope
task_id: KW-20260701-123814-Red-Team-Studio-Live-smoke-RedTeam-AX-v2-Report-Studio-and-extend-sample-E2E-gates
project: Red Team Studio
task: Live smoke RedTeam AX v2 Report Studio and extend sample E2E gates
created: 2026-07-01T12:38:14+09:00
---

# Scope

## User Intent

Continue the RedTeam AX objective by proving the first v2 slice works in the running 5177/8765 app and by adding a sample case E2E test that reaches Korean Report v2 validation with zero unsupported claims, zero unapproved high-risk actions, and zero findings without evidence.

## Included

- Verify live 8765 backend v2 routes.
- Restart stale 8765 backend if it does not expose `/api/redteam/v2`.
- Verify 5177 Report Studio renders `레드팀 분석2`.
- Verify browser click on `ToolActionCard 계획` creates a visible ToolActionCard queue row.
- Add fixture/API sample E2E test.
- Update `FINAL_PLAN.md` slice 2 status.

## Excluded

- Full persistent workflow storage.
- Final report artifact export.
- Full starter pack regression.
- Any real high-risk redteam tool execution.

## Completion Definition

This slice is complete when live smoke, screenshot evidence, sample E2E test, focused regression, plan update, and knowledge workflow close all pass. The broader goal remains active until full security/report/release gates and final E2E regression are complete.
