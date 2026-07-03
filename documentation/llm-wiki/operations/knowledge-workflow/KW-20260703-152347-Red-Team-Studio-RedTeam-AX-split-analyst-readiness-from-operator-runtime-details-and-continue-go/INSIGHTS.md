---
type: insight
status: draft
project: Red Team Studio
created: 2026-07-03T15:23:47+09:00
---

# Insight

## 관찰

## 통찰

## 제안

## 적용 가능 범위

## 후속 작업

# Insights

- The frontend already had a panel-level split, but the API contract did not yet provide role-separated summaries. Adding the summaries to `/runtime-readiness` gives the UI a stable source of truth instead of deriving beginner guidance from raw blocker lists.
- The analyst-facing contract must explicitly keep `can_run_active_scan=false`; otherwise "tool execution ready" can be misread as permission to run high-risk scans.
- Existing raw `next_action_plan` and blockers should remain available for audit and environment operators, but they should not be the first thing a low-experience analyst must parse.
