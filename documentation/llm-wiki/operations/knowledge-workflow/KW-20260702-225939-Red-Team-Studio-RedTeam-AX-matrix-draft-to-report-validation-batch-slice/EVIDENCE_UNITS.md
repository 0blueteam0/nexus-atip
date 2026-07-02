---
type: evidence_unit
status: complete
id: EU-REDTEAM-AX-MATRIX-REPORT-DRAFT-20260702
project: Red Team Studio
created: 2026-07-02T22:59:39+09:00
---

# Evidence Units

| claim | source | command | exit_code | evidence |
|---|---|---|---:|---|
| Report draft API exists | `runtime/redteam_v2_api_router.py` | `python -m py_compile ...` | 0 | `POST /tool-result-finding-claim-review/matrix-draft/report-draft` |
| Held rows block generation | `tests/test_redteam_v2_api_router.py` | focused pytest | 0 | `test_tool_result_report_draft_from_matrix_blocks_held_rows` passed |
| Ready rows generate Korean Report v2 draft | `tests/test_redteam_v2_api_router.py` | focused pytest | 0 | `test_tool_result_report_draft_from_matrix_generates_after_matrix_ready` passed |
| Full API regression remains green | v2 API suite | `.venv/Scripts/python.exe -m pytest ... -q` | 0 | 58 passed |
| Frontend Korean guidance remains valid | RedTeam2 sanity | Korean inventory command | 0 | 1120 Korean-context literals, ratio 0.1294 |
| Accepted gate remains green | accepted gate artifact | `redteam_ax_accepted_gate_manifest.py` | 0 | 24/24 passed |

## Limits

Evidence proves the controlled selected-candidate report draft path. It does not prove every real tool result candidate is approved or exported.
