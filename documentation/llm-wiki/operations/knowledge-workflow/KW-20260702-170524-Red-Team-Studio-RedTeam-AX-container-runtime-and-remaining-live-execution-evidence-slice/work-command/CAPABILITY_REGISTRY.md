---
type: work_command_record
task_id: KW-20260702-170524-Red-Team-Studio-RedTeam-AX-container-runtime-and-remaining-live-execution-evidence-slice
project: Red Team Studio
task: RedTeam AX container runtime and remaining live execution evidence slice
created: 2026-07-02T17:05:24+09:00
source_package: K:/wiki/work command
---

# CAPABILITY_REGISTRY

## Registry

| name | type | checked_at | source | supported | unknown | use_case |
|---|---|---|---|---|---|---|
| Python sanity scripts | local execution | 2026-07-02 | `.venv/Scripts/python.exe` | yes | no | readiness artifacts and regression gates |
| FastAPI test client | local test | 2026-07-02 | `pytest tests/test_redteam_v2_api_router.py` | yes | no | API projection contract |
| Node syntax check | local static check | 2026-07-02 | `node --check reports.js` | yes | no | frontend syntax guard |
| Docker daemon | runtime | 2026-07-02 | `docker version` | no | no | blocked real container smoke |
| WSL distro | runtime | 2026-07-02 | `redteam_ax_wsl_runtime_readiness.py --allow-start` | no | no | blocked WSL start evidence |
