---
type: tool_decision
task_id: KW-20260707-095407-Red-Team-Studio-Continue-RedTeam-AX-safe-smoke-result-to-evidence-workflow
project: Red-Team-Studio
task: Continue RedTeam AX safe smoke result to evidence workflow
created: 2026-07-07T09:54:07+09:00
---

# Tool Decision

| tool | purpose | decision |
|---|---|---|
| `apply_patch` | scoped code/docs edits | Used for all manual file edits. |
| `py_compile` | Python syntax check | Used on `runtime/redteam_v2_models.py`. |
| `node --check` | JavaScript syntax check | Used on `reports.js`. |
| `pytest -k safe_local_smoke_allows_high_risk_version_only_dry_run` | backend regression | Used to verify candidate-only semantics without real scanner execution. |
| frontend sanity scripts | UI contract regression | Used to verify RedTeam2 runtime/launch copy and button contracts. |
| `git diff --check` | whitespace check | Used before staging. |

## Safety Routing

No external scanner, Docker, WSL, OpenVAS, ZAP, Nuclei, Trivy, SCA, or npm audit command was executed by this slice. The backend regression patches `subprocess.run`.
