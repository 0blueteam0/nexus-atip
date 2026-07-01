# Decisions

| id | decision | reason | status |
|---|---|---|---|
| D1 | Use `/api/redteam/v2` for the first v2 slice | Preserve existing `/api/redteam` behavior as regression baseline | accepted |
| D2 | Represent high-risk execution as HITL/manual-run record | The objective requires humans approve, perform, and review high-risk actions | accepted |
| D3 | Keep v2 frontend state separate from v1 redteam state | The user asked for a duplicated adjacent tab without breaking the original | accepted |
| D4 | Use direct unittest file execution in `.venv` | System Python lacked FastAPI and pytest; tests are unittest-compatible | accepted |
| D5 | Do not mark the whole goal complete | Full E2E, live smoke, security/report gates, and push remain | accepted |
