---
type: decision_log
task_id: KW-20260701-132949-Red-Team-Studio-Implement-RedTeam-AX-v2-report-export-UI-controls
project: Red Team Studio
task: Implement RedTeam AX v2 report export UI controls
created: 2026-07-01T13:29:49+09:00
---

# Decision Log

| time | decision | alternatives | reason | evidence |
|---|---|---|---|---|
|  |  |  |  |  |
## Decision Log

- D-001: Add report export controls inside `레드팀 분석2`, not the legacy `레드팀 분석` tab.
- D-002: Preserve the backend as source of truth for pass/blocked, approval, and export status; UI only displays returned gate snapshots.
- D-003: Disable approve/export buttons until the preceding API artifact exists.
- D-004: Use existing `smallPanel` visual pattern to avoid broad frontend refactoring.
