---
type: evidence_unit
status: draft
id:
project: Red Team Studio
created: 2026-07-03T10:25:42+09:00
---

# Evidence Unit

## Claim

## Source

- source_type:
- path_or_url:
- command:
- exit_code:
- collected_at:

## Evidence

## Confidence

## Limits

## Related Decisions

## Evidence units

- `command`: `.venv/Scripts/python.exe Red Team Studio/고도화/sanity/redteam_ax_development_byproduct_exclusion_review.py`
  - `exit_code`: 0
  - `verified_at`: 2026-07-03
  - `result`: 178 development byproduct refs excluded from completion/report-claim evidence.
  - `artifact_path`: `Red Team Studio/고도화/completion-audit/redteam_ax_development_byproduct_exclusion_review.json`
- `command`: `.venv/Scripts/python.exe Red Team Studio/고도화/sanity/test_development_byproduct_exclusion_review.py`
  - `exit_code`: 0
  - `verified_at`: 2026-07-03
- `command`: `.venv/Scripts/python.exe Red Team Studio/고도화/sanity/test_completion_audit_matrix.py`
  - `exit_code`: 0
  - `verified_at`: 2026-07-03
- `command`: `.venv/Scripts/python.exe -m pytest tests/test_redteam_v2_api_router.py -q`
  - `exit_code`: 0
  - `result`: 74 passed, 1 warning
- `command`: `.venv/Scripts/python.exe Red Team Studio/고도화/sanity/redteam_ax_accepted_gate_manifest.py`
  - `exit_code`: 0 after rerun
  - `result`: accepted_gate_count 26, passed_gate_count 26, failed_gate_count 0
