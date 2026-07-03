---
type: evidence_unit
status: complete
id: EU-REDTEAM-AX-20260703-ANALYST-SUBMISSION
project: Red-Team-Studio
created: 2026-07-03T14:50:10+09:00
---

# Evidence Units

## EU-001

Claim: Python backend syntax is valid.

Source:
- source_type: command
- command: `./.venv/Scripts/python.exe -m py_compile runtime/redteam_v2_models.py runtime/redteam_v2_api_router.py`
- exit_code: 0
- collected_at: 2026-07-03T15:xx:xx+09:00

Evidence: command completed without output or errors.

Confidence: high

Limits: syntax only, not runtime semantics.

## EU-002

Claim: Frontend JS syntax is valid.

Source:
- source_type: command
- command: `node --check "soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js"`
- exit_code: 0
- collected_at: 2026-07-03T15:xx:xx+09:00

Evidence: command completed without output or errors.

Confidence: high

Limits: syntax only, not browser rendering.

## EU-003

Claim: RedTeam v2 API tests pass after adding six-tool submission template.

Source:
- source_type: command
- command: `./.venv/Scripts/python.exe tests/test_redteam_v2_api_router.py`
- exit_code: 0
- collected_at: 2026-07-03T15:xx:xx+09:00

Evidence: `Ran 84 tests in 12.460s OK`.

Confidence: high

Limits: TestClient coverage, not live scanner execution.

## EU-004

Claim: RedTeam2 frontend contracts pass.

Source:
- source_type: command
- command: `redteam_ax_frontend_launch_readiness_contract.py`, `redteam_ax_frontend_runtime_readiness_contract.py`, `test_redteam2_korean_copy_inventory.py`
- exit_code: 0 for each script after correction
- collected_at: 2026-07-03T15:xx:xx+09:00

Evidence: launch readiness passed, runtime readiness passed, Korean copy inventory passed with `1754/1980 Korean-context literals`.

Confidence: high

Limits: Static contract tests, not Playwright screenshot verification.

## EU-005

Claim: Audit matrix and JSON are valid.

Source:
- source_type: command
- command: `./.venv/Scripts/python.exe "Red Team Studio/고도화/sanity/test_completion_audit_matrix.py"` and `python -m json.tool`
- exit_code: 0
- collected_at: 2026-07-03T15:xx:xx+09:00

Evidence: `[+] completion audit matrix sanity passed`.

Confidence: high

Limits: Validates matrix structure and counts, not real-world evidence completeness.

## EU-006

Claim: Overall RedTeam AX goal remains incomplete and must not be reported complete.

Source:
- source_type: command
- command: `POST /api/redteam/v2/goal-completion-review` via TestClient
- exit_code: 0
- collected_at: 2026-07-03T15:xx:xx+09:00

Evidence: `goal_completion_blocked`, `remaining_gap_count=3`, `goal_status=active_incomplete`.

Confidence: high

Limits: Based on current internal review model and available evidence.
