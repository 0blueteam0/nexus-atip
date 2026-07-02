---
type: decision_log
task_id: KW-20260702-225939-Red-Team-Studio-RedTeam-AX-matrix-draft-to-report-validation-batch-slice
project: Red Team Studio
task: RedTeam AX matrix draft to report validation batch slice
created: 2026-07-02T22:59:39+09:00
---

# Decision Log

| time | decision | alternatives | reason | evidence |
|---|---|---|---|---|
| 2026-07-02T23:00+09:00 | Add report-draft API after Matrix draft. | Tell user to call generate_report manually. | A guarded API makes the report handoff auditable. | API route and tests |
| 2026-07-02T23:01+09:00 | Block report draft when held rows exist. | Generate partial reports by default. | Partial default could hide unapproved candidates. | held-row test |
| 2026-07-02T23:02+09:00 | Reuse existing `generate_report`. | New report renderer. | Single source of report gate and Korean renderer. | ready-row test |
| 2026-07-02T23:03+09:00 | Keep export approval separate. | Auto-export after draft. | User objective requires HITL/final approval gates. | UI copy and API flags |
