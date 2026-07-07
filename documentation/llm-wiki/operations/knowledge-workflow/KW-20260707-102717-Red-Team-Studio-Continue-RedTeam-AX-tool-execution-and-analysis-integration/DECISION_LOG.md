---
type: decision_log
task_id: KW-20260707-102717-Red-Team-Studio-Continue-RedTeam-AX-tool-execution-and-analysis-integration
project: Red Team Studio
task: Continue RedTeam AX tool execution and analysis integration
created: 2026-07-07T10:27:17+09:00
---

# Decision Log

| time | decision | alternatives | reason | evidence |
|---|---|---|---|---|
| 2026-07-07T10:27+09:00 | Expose execution presets as read-only catalog data. | Let frontend/user invent command lines. | Reduces accidental high-risk scanner execution and aligns with ROE/HITL. | API/test changes in this slice. |
| 2026-07-07T10:27+09:00 | Only Trivy and npm audit become runner preset candidates. | Include Nuclei/OpenVAS/ZAP active commands. | T3 scanners need approval or service/report import; SCA is import-only. | `list_toolchain_execution_presets()`. |
| 2026-07-07T10:27+09:00 | Preset application fills draft input only. | Execute directly from preset API. | Execution must still pass ToolActionCard, ROE, ExecutionPlan, token, wrapper pin, runner gates. | Frontend `applyRedTeam2ExecutionPresets()`. |
