---
type: decision_log
task_id: KW-20260703-104120-Red-Team-Studio-RedTeam-AX-real-operating-evidence-closure-next-slice
project: Red Team Studio
task: RedTeam AX real operating evidence closure next slice
created: 2026-07-03T10:41:20+09:00
---

# Decision Log

| time | decision | alternatives | reason | evidence |
|---|---|---|---|---|
| 2026-07-03T11:04:44+09:00 | Enforce development byproduct exclusion in operating closure submission package API. | Only document the rule in completion audit. | Human review starts from this package, so byproduct sources must be blocked before close payload approval. | `runtime/redteam_v2_models.py`, `tests/test_redteam_v2_api_router.py` |
| 2026-07-03T11:04:44+09:00 | RedTeam2 sends `require_real_completion_evidence=true` by default. | Let operators choose strict mode manually. | The goal requires zero evidence-less/unsupported completion claims, so strict mode is the safe default. | `reports.js` |
| 2026-07-03T11:04:44+09:00 | accepted gate runner writes stdout/stderr to files. | Keep `capture_output=True` and raise timeout. | Captured pytest subprocess timed out at 180/300 seconds while direct execution passed; file logs keep evidence without pipe deadlock risk. | `redteam_ax_accepted_gate_manifest.py`, latest accepted manifest |
