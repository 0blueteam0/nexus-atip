---
type: evidence_unit
status: completed
id: EU-REDTEAM-AX-COLLECTION-EVIDENCE-APPROVAL-001
project: Red Team Studio
created: 2026-07-02T23:22:13+09:00
---

# Evidence Unit

## Claim

Toolchain collection Evidence candidates can now be approved through a HITL batch API with identity binding, while preserving no-command-execution and no-Finding/no-Claim guarantees.

## Source

- `runtime/redteam_v2_models.py`
- `runtime/redteam_v2_api_router.py`
- `tests/test_redteam_v2_api_router.py`
- `soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js`

## Command Evidence

- `pytest tests/test_redteam_v2_api_router.py -q`: exit_code 0, 59 passed.
- `redteam_ax_accepted_gate_manifest.py`: exit_code 0, 24/24 passed.

## Limits

The proof uses regression fixture outputs. Real scanner outputs still need collection, approval, Finding promotion, Matrix, and Report gates.
