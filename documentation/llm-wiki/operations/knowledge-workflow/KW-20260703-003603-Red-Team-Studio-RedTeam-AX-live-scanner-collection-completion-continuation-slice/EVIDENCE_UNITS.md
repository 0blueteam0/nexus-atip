---
type: evidence_unit
status: complete
id: redteam-ax-six-tool-imported-output-e2e
project: Red Team Studio
created: 2026-07-03T00:36:03+09:00
---

# Evidence Unit

## Claim

RedTeam AX now supports six-tool operator/service imported outputs in one governed toolchain collection without executing scanner commands from the import path.

## Command Evidence

| command | exit_code | evidence |
|---|---:|---|
| `python -m py_compile runtime/redteam_v2_models.py tests/test_redteam_v2_api_router.py` | 0 | syntax valid |
| `pytest tests/test_redteam_v2_api_router.py -k "six_named_tools or toolchain_collect_results" -q` | 0 | 2 passed |
| `pytest tests/test_redteam_v2_api_router.py -q` | 0 | 60 passed |
| `node --check reports.js` | 0 | frontend syntax valid |
| `redteam_ax_frontend_runtime_readiness_contract.py` | 0 | contract passed |
| `test_redteam2_korean_copy_inventory.py` | 0 | 1260/1448 Korean-context literals, ratio 0.1271 |
| `test_completion_audit_matrix.py` | 0 | audit sanity passed |
| `test_plan_contract.py` | 0 | plan contract passed |
| `python -m json.tool redteam_ax_completion_audit_matrix.json` | 0 | JSON valid |
| `redteam_ax_accepted_gate_manifest.py` | 0 | 24/24 accepted gates passed |

## Artifact Evidence

- `projects/ai-agentic-soc/archive/runs/redteam-ax-v2-accepted-gates/latest_accepted_gate_manifest.json`
- `projects/ai-agentic-soc/archive/runs/redteam-ax-v2-accepted-gates/accepted_gate_manifest_20260702T154457Z.json`
- `projects/ai-agentic-soc/Red Team Studio/고도화/completion-audit/redteam2_korean_copy_inventory.json`

## Limits

This is representative imported-output proof, not proof that real organization scanner endpoints or Docker runtime blockers are cleared.
