---
type: insights
project: Red Team Studio
task: RedTeam AX operator evidence collection package slice
---

# Insights

- Remediation runbook은 사람이 할 일을 설명하지만, Evidence Card 후보로 무엇을 첨부해야 하는지는 별도 package가 더 명확하다.
- Runtime readiness API는 command execution surface가 아니어야 하므로 새 package도 read-only artifact projection으로만 연결했다.
- Accepted gate에 package generator를 넣어 다음 slice에서 runbook schema가 바뀌면 evidence package 회귀가 즉시 드러난다.
