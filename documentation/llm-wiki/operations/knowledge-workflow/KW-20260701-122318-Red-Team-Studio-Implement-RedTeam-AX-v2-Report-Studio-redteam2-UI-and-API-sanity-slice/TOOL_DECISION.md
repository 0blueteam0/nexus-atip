---
type: tool_decision
task_id: KW-20260701-122318-Red-Team-Studio-Implement-RedTeam-AX-v2-Report-Studio-redteam2-UI-and-API-sanity-slice
project: Red Team Studio
---

# Tool Decision

| need | chosen_tool | alternatives | reason |
|---|---|---|---|
| Source search | `rg` | recursive `Get-ChildItem` | Faster targeted discovery across large tree |
| File inspection | `Get-Content -Encoding UTF8` | bare PowerShell content | Avoid Korean mojibake |
| Code edits | `apply_patch` | shell write tricks | Preserve scoped diffs and obey editing rules |
| Backend test | `.venv/Scripts/python.exe` | system Python, pytest | System Python lacked FastAPI/pytest; tests are unittest files |
| Frontend build | `npm.cmd run build` | `npm run build` | PowerShell blocked `npm.ps1` |

No destructive commands were used. No high-risk redteam tools were executed.
