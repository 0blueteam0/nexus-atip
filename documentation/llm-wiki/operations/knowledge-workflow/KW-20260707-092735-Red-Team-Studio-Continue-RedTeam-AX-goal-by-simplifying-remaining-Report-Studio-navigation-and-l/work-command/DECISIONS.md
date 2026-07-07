---
type: work_command_record
task_id: KW-20260707-092735-Red-Team-Studio-Continue-RedTeam-AX-goal-by-simplifying-remaining-Report-Studio-navigation-and-l
project: Red-Team-Studio
task: Continue RedTeam AX updated goal with six-tool execution/result UX
created: 2026-07-07T09:27:35+09:00
source_package: K:/wiki/work command
---

# DECISIONS

## D1. SCA Stays Import-Only

Decision: keep `TOOL-SCA-001` out of safe install command execution and show it as `결과 첨부 필요`.

Reason: backend ToolProfile defines SCA as `adapter_type=import_only` with no executable command. A fake command path would misrepresent operational readiness.

Impact: frontend projection now includes `import_only_guidance_rows`; default RedTeam2 view renders `결과 첨부 필요 도구`.
