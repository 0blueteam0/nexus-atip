---
type: decision_log
project: Red Team Studio
task: RedTeam AX next completion blocker reduction slice
---

# Decision Log

| id | decision | reason | impact |
|---|---|---|---|
| D-001 | Add `운영자 조치 runbook 단계` table | Operators need actionable details, not only counts | Better Korean UI guidance |
| D-002 | Add fallback step sequence | Artifact may be unavailable at first render | UI still teaches correct order |
| D-003 | Keep commands display-only | Avoid unapproved execution | Maintains ROE/HITL boundary |
| D-004 | Keep goal active | Live promotion blockers remain | Prevents unsupported completion claim |
