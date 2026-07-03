---
type: insights
project: Red Team Studio
task: RedTeam AX real operating evidence workflow continuation
created: 2026-07-03T13:16:10+09:00
---

# Insights

- Missing scanner outputs were previously reported as blockers but not translated into operator-readable filename and format guidance.
- The new remediation rows keep the API read-only and avoid scanner execution while making the next evidence collection step concrete.
- `does_not_execute_tool=true` is necessary because the word "remediation" can otherwise be misread as an automated repair or active scan action.
- The broader `/goal` is still blocked by real evidence and approval gates, not by this UI/API guidance layer.
