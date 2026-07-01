---
type: decision_log
task_id: KW-20260701-131412-Red-Team-Studio-Implement-RedTeam-AX-v2-tool-result-import-normalize-and-evidence-candidate-APIs
project: Red Team Studio
task: Implement RedTeam AX v2 tool result import normalize and evidence candidate APIs
created: 2026-07-01T13:14:12+09:00
---

# Decision Log

| time | decision | alternatives | reason | evidence |
|---|---|---|---|---|
|  |  |  |  |  |
| 2026-07-01T13:18:00+09:00 | Tool output import requires an existing manually executed run. | Allow arbitrary output upload. | Preserve ToolAction/manual-run chain of custody. | API tests |
| 2026-07-01T13:18:00+09:00 | Normalized result includes limitations and prohibited report claims by default. | Store raw parser output only. | Prevent unsupported findings from raw tool output. | `normalize_tool_run` |
| 2026-07-01T13:18:00+09:00 | create-evidence returns candidate Evidence, not approved evidence. | Auto-approve tool output evidence. | Analyst review must happen before report claims. | sample E2E/live smoke |
