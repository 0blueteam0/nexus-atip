---
type: quality_gate
status: ready_to_close
---

# Quality Gate

| check | status | evidence |
|---|---|---|
| Scope recorded | pass | `SCOPE.md` |
| Tool decision recorded | pass | `TOOL_DECISION.md` |
| Evidence recorded | pass | `EVIDENCE_UNITS.md` |
| Code syntax | pass | py_compile exit 0 |
| Focused regression | pass | targeted pytest exit 0 |
| Audit sanity | pass | completion audit sanity exit 0 |
| Goal completion not overclaimed | pass | goal review blocked |

Gate can close after `knowledge_workflow.py close` writes `QUALITY_GATE_RESULT.json`.
