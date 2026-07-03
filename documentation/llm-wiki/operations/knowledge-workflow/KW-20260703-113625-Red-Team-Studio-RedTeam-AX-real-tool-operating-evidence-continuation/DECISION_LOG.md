---
type: decision_log
task_id: KW-20260703-113625-Red-Team-Studio-RedTeam-AX-real-tool-operating-evidence-continuation
project: Red Team Studio
task: RedTeam AX real tool operating evidence continuation
created: 2026-07-03T11:36:25+09:00
---

# Decision Log

| time | decision | alternatives | reason | evidence |
|---|---|---|---|---|
| 2026-07-03T11:38:00+09:00 | Use project `.venv` for runtime smoke | System Python | System Python lacked FastAPI; accepted gates use `.venv` | first smoke failed with `ModuleNotFoundError: fastapi`; venv smoke reached runner |
| 2026-07-03T11:39:00+09:00 | Clear Docker image ENTRYPOINT in ephemeral container launcher | Keep image ENTRYPOINT | Approved argv must be authoritative; Trivy image duplicated command via ENTRYPOINT | `runtime/redteam_v2_models.py`, API regression |
| 2026-07-03T11:41:00+09:00 | Keep RTA-COMP-015 partial | Mark Docker pass as full runtime completion | WSL and external OpenVAS/ZAP gates remain blocked | strict promotion 1 passed, 3 failed |
| 2026-07-03T11:49:00+09:00 | Keep thread goal active_incomplete | Mark goal complete | Goal completion review reports 1 unresolved item and 4 remaining gaps | `/api/redteam/v2/goal-completion-review` result |
