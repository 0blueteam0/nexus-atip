---
type: decision_log
task_id: KW-20260701-170633-Red-Team-Studio-Implement-RedTeam-AX-v2-CLI-wrapper-version-hash-verification-slice
project: Red-Team-Studio
task: Implement RedTeam AX v2 CLI wrapper version hash verification slice
created: 2026-07-01T17:06:33+09:00
---

# Decision Log

| time | decision | alternatives | reason | evidence |
|---|---|---|---|---|
| 2026-07-01T17:18:00+09:00 | Add wrapper manifest registry as read-only API | Put fields only inside existing readiness endpoint | Tool install/version/hash status must be visible per ToolProfile before runner automation | `runtime/redteam_v2_models.py`, `runtime/redteam_v2_api_router.py` |
| 2026-07-01T17:22:00+09:00 | Do not execute version commands in registry reads | Run each tool with `--version` | Registry reads should be low-risk and non-invasive | `version_probe.mode=not_executed_safe_manifest_only` |
| 2026-07-01T17:25:00+09:00 | Mark import-only SCA as trusted without wrapper pin | Force pin on every tool | No CLI binary wrapper is involved for import-only artifacts | `pinning_status=import_only` |
| 2026-07-01T17:27:00+09:00 | Emit preflight warnings before changing token behavior | Block planning token when hash is unpinned | This slice is preflight visibility, not actual runner enforcement | `wrapper_sha256_pin_required_before_runner_execution` |
| 2026-07-01T17:35:00+09:00 | Install missing FastAPI test dependency into bundled Python | Skip API tests | Both system and bundled Python lacked `fastapi`, blocking regression execution | API regression 35 tests OK after install |
