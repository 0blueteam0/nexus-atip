---
type: evidence_unit
status: complete
id: EU-REDTEAM-AX-MATRIX-DRAFT-20260702
project: Red Team Studio
created: 2026-07-02T22:45:36+09:00
---

# Evidence Units

| claim | source_type | path_or_url | command | exit_code | evidence |
|---|---|---|---|---:|---|
| Matrix draft API exists and routes through v2 backend | source | `projects/ai-agentic-soc/runtime/redteam_v2_api_router.py` | `python -m py_compile ...` | 0 | `POST /api/redteam/v2/tool-result-finding-claim-review/matrix-draft` |
| Approval gating works for held and ready rows | test | `projects/ai-agentic-soc/tests/test_redteam_v2_api_router.py` | `.venv/Scripts/python.exe -m pytest projects/ai-agentic-soc/tests/test_redteam_v2_api_router.py -q` | 0 | `56 passed` |
| RedTeam2 Korean UI exposes the Matrix draft condition | sanity | `Red Team Studio/고도화/sanity/redteam_ax_frontend_runtime_readiness_contract.py` | `python ...redteam_ax_frontend_runtime_readiness_contract.py` | 0 | contract passed |
| Korean visible copy remains within policy | sanity | `Red Team Studio/고도화/sanity/test_redteam2_korean_copy_inventory.py` | `python ...test_redteam2_korean_copy_inventory.py` | 0 | `1114/1285 Korean-context literals, English-only ratio=0.13` |
| Accepted gate suite remains green | artifact | `projects/ai-agentic-soc/archive/runs/redteam-ax-v2-accepted-gates/latest_accepted_gate_manifest.json` | `python ...redteam_ax_accepted_gate_manifest.py` | 0 | `24/24 passed` |

## Limits

This evidence proves the guarded Matrix draft API and regression coverage. It does not prove Docker/WSL/OpenVAS/ZAP live readiness, all real candidate approvals, or final report generation from all real candidates.
