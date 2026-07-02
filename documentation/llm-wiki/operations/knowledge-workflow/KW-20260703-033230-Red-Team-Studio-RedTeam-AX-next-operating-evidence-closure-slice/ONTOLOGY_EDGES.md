---
type: ontology_edges
status: complete
project: Red Team Studio
created: 2026-07-03T03:32:30+09:00
updated: 2026-07-03T04:24:00+09:00
---

# Ontology Edges

| subject | predicate | object | evidence |
|---|---|---|---|
| Operator Evidence Card Import API | creates | Evidence Card | `runtime/redteam_v2_models.py` |
| Operator Evidence Card Import API | requires | Human Review Confirmation for approval | `tests/test_redteam_v2_api_router.py` |
| RedTeam Analysis 2 UI | calls | `/api/redteam/v2/toolchains/operator-evidence-card-import` | `reports.js` |
| Accepted Gate Manifest | verifies | RedTeam AX current accepted gates 24/24 | `latest_accepted_gate_manifest.json` |
