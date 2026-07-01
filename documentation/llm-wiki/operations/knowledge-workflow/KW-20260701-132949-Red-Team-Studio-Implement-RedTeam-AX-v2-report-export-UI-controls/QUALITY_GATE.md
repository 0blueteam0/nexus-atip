---
type: quality_gate
task_id: KW-20260701-132949-Red-Team-Studio-Implement-RedTeam-AX-v2-report-export-UI-controls
project: Red Team Studio
task: Implement RedTeam AX v2 report export UI controls
created: 2026-07-01T13:29:49+09:00
---

# Quality Gate

| gate | result | evidence |
|---|---|---|
| Worklog updated | pending |  |
| Tool decision recorded | pending |  |
| Evidence units recorded | pending |  |
| Decisions captured | pending |  |
| Insights captured | pending |  |
| Ontology edges considered | pending |  |
| Handoff updated | pending |  |
| Official docs separated from work meta | pending |  |
| Encoding/log verification passed | pending |  |
| qmd update considered | pending |  |
## Quality Gate

- Frontend build: pass.
- Backend regression: pass, 17 tests OK.
- Plan sanity: pass.
- Python compile: pass.
- Browser render smoke: pass.
- Browser click flow smoke: pass.
- Known residual risks:
  - Approver identity is typed, not auth-bound.
  - Full release/security/starter-pack regression remains open.
  - WSL/bash Playwright wrapper failed; Windows `npx` path was used successfully.
