---
type: evidence_units
task_id: KW-20260703-010816-Red-Team-Studio-RedTeam-AX-scanner-artifact-manifest-builder-slice
project: Red Team Studio
task: RedTeam AX scanner artifact manifest builder slice
created: 2026-07-03T01:08:16+09:00
---

# Evidence Units

| id | source_path | evidence_type | notes |
|---|---|---|---|
| EV-001 | `runtime/redteam_v2_models.py` | source | Builder scans workspace files and creates import payload without execution. |
| EV-002 | `runtime/redteam_v2_api_router.py` | source | Exposes build-artifact-manifest route. |
| EV-003 | `tests/test_redteam_v2_api_router.py` | test | Builder fixture test plus import handoff. |
| EV-004 | `reports.js` | frontend | Korean source folder input and manifest builder button. |
| EV-005 | `latest_accepted_gate_manifest.json` | gate | 24/24 accepted gates passed. |
