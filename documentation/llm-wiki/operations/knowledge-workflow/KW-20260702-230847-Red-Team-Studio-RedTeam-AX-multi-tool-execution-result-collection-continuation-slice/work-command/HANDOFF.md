# HANDOFF

## For Next Agent

Start from `runtime/redteam_v2_models.py::collect_toolchain_results` and the route `POST /api/redteam/v2/toolchains/{toolchain_id}/collect-results`.

## Verification Already Run

- `pytest tests/test_redteam_v2_api_router.py -q`: 59 passed.
- `redteam_ax_accepted_gate_manifest.py`: 24/24 passed.

## Remaining Work

Run this path on real governed scanner outputs, approve Evidence Cards, promote Findings, approve severity, and regenerate Matrix/report/export.
