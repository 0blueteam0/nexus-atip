---
type: decision_log
task_id: KW-20260701-125421-Red-Team-Studio-Implement-RedTeam-AX-v2-persistent-approval-queue-and-UI-reload
project: Red Team Studio
task: Implement RedTeam AX v2 persistent approval queue and UI reload
created: 2026-07-01T12:54:21+09:00
---

# Decision Log

| time | decision | alternatives | reason | evidence |
|---|---|---|---|---|
|  |  |  |  |  |
| 2026-07-01T13:00:00+09:00 | Store approval requests and decisions under `archive/runs/redteam-ax-v2/{case_id}/approvals`. | Add database schema now. | Artifact persistence already backs Evidence/Report v2 and avoids broad storage migration in this slice. | `redteam_v2_models.py`, `CASE-LIVE-APPROVAL-002/approvals` |
| 2026-07-01T13:00:00+09:00 | `/request-approval` and `/approve` update state only and do not execute tools. | Trigger direct execution after approval. | User objective requires high-risk work to remain human approved/performed/reviewed. | API tests and live smoke |
| 2026-07-01T13:00:00+09:00 | `레드팀 분석2` status refresh loads persisted queue from backend. | Keep in-memory queue only. | UI must survive refresh/server state and support LLM-wiki/evidence traceability. | `reports.js`, Playwright smoke |
