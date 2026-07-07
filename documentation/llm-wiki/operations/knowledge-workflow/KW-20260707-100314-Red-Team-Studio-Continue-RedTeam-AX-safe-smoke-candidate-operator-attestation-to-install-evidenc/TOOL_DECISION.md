---
type: tool_decision
task_id: KW-20260707-100314-Red-Team-Studio-Continue-RedTeam-AX-safe-smoke-candidate-operator-attestation-to-install-evidenc
project: Red-Team-Studio
task: Continue RedTeam AX safe smoke candidate operator attestation to install evidence registry
created: 2026-07-07T10:03:14+09:00
---

# Tool Decision

| tool | purpose | decision |
|---|---|---|
| `rg` / PowerShell reads | locate current registry/API/UI code | Used before editing. |
| `apply_patch` | scoped edits | Used for backend, frontend, tests, sanity, docs, KW files. |
| `py_compile` | Python syntax check | Used on model and router. |
| `node --check` | JS syntax check | Used on `reports.js`. |
| `pytest -k ...` | backend regression | Used to verify operator attestation and prior install evidence contracts. |
| frontend sanity scripts | UI contract regression | Used for runtime and launch readiness contracts. |
| `git diff --check` | whitespace gate | Used before close/stage. |

No real scanner process or active scan was executed.
