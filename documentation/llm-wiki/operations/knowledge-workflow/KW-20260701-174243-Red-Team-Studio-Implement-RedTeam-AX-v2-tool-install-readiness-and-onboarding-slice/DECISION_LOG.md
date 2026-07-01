---
type: decision_log
task_id: KW-20260701-174243-Red-Team-Studio-Implement-RedTeam-AX-v2-tool-install-readiness-and-onboarding-slice
project: Red-Team-Studio
task: Implement RedTeam AX v2 tool install readiness and onboarding slice
created: 2026-07-01T17:42:43+09:00
---

# Decision Log

| time | decision | alternatives | reason | evidence |
|---|---|---|---|---|
|  |  |  |  |  |
| 2026-07-01T17:45:00+09:00 | Add install readiness as plan-only API. | Execute installers directly. | Install execution needs explicit operator control and later package manager policy. | API test asserts `commands_executed_by_api=false`. |
| 2026-07-01T17:45:00+09:00 | Include readiness in `analysis-tools`. | Keep separate endpoint only. | RedTeam2 ToolHub needs one loaded object per selected tool. | Frontend ToolHub uses `selectedTool.install_readiness`. |
| 2026-07-01T17:45:00+09:00 | Treat SCA as import-only ready. | Force wrapper pinning for SCA. | SCA profile has no runner command and uses uploaded SBOM/lockfile/SCA export. | Test checks `TOOL-SCA-001` status. |
| 2026-07-01T17:45:00+09:00 | Keep operator commands visible but not executable. | Add install buttons. | UI should not run package manager commands without a dedicated installer approval system. | RedTeam2 table displays plan only. |
