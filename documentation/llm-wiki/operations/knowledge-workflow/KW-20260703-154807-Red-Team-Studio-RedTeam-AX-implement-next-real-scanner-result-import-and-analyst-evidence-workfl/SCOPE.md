---
type: scope
task_id: KW-20260703-154807-Red-Team-Studio-RedTeam-AX-implement-next-real-scanner-result-import-and-analyst-evidence-workfl
project: Red Team Studio
task: RedTeam AX implement next real scanner result import and analyst evidence workflow slice
created: 2026-07-03T15:48:07+09:00
enforcement_level: L2-or-higher
---

# Scope

## User Intent

Continue the active RedTeam AX goal by improving the real scanner result import workflow. This slice focuses on OpenVAS/ZAP read-only service import and the beginner analyst next-step display after the import is projected into a toolchain.

## Included

- Add `analyst_progress_summary` to `/api/redteam/v2/scanner-service-imports/{tool_id}` when a toolchain projection is created.
- Render service import progress in RedTeam2 with Korean tables.
- Extend API regression and frontend sanity contracts.
- Update FINAL_PLAN, Detailed_PLAN, LLM Wiki, and completion audit.

## Excluded

- Executing OpenVAS/ZAP active scans.
- Storing secrets or API keys.
- Proving real organization endpoint availability.
- Approving Evidence, promoting Findings, approving severity, exporting Report v2, or closing the overall completion gate.

## Completion Definition

This slice is complete when service import progress projection is implemented, tested, documented, recorded in KW, committed, and pushed. The overall `/goal` remains active until real scanner outputs pass the full Evidence/Finding/Matrix/Report/completion workflow.
