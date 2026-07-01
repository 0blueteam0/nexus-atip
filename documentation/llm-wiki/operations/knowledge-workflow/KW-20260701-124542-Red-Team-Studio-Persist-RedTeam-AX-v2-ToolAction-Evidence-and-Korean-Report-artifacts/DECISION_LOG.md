---
type: decision_log
task_id: KW-20260701-124542-Red-Team-Studio-Persist-RedTeam-AX-v2-ToolAction-Evidence-and-Korean-Report-artifacts
project: Red Team Studio
---

# Decision Log

| decision | reason | command | exit_code | artifact_path |
|---|---|---|---:|---|
| Store under `archive/runs/redteam-ax-v2` | Matches existing runtime artifact pattern | sample E2E | 0 | `archive/runs/redteam-ax-v2` |
| Generate Markdown only when report gate passes | Prevent unsupported/evidence-less report export | live generate | 0 | `RTRPT-573FF3632968.md` |
| Keep approved export route for next slice | Need separate human approval semantics | `FINAL_PLAN.md` | 0 | `FINAL_PLAN.md` |
