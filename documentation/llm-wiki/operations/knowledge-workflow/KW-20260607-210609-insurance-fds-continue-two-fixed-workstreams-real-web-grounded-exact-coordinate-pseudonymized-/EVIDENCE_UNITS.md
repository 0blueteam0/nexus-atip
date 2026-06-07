# Evidence Units

## E1: Previous scope recovered

- command: `session_search(query='"2가지 스코프" OR "두 가지 스코프" OR "scope" "스코프"', sort='newest')`
- verified_at: 2026-06-07T21:06:09+09:00
- evidence: previous assistant pause point identified two workstreams.
- artifact_path: `documentation/reports/INSURANCE_FDS_TWO_FIXED_WORKSTREAMS_SCOPE_20260605.ko.md`

## E2: Targeted failure reproduced

- command: `uvx --from pytest --with pillow pytest tests/test_insurance_fds_real_image_field_inventory.py -q -vv --tb=long`
- exit_code: 2
- evidence: `FileNotFoundError: scripts/insurance_fds_real_image_field_inventory.py`
- impact: confirmed collection blocker root cause.

## E3: Missing script implemented

- artifact_path: `scripts/insurance_fds_real_image_field_inventory.py`
- source_path: `tests/test_insurance_fds_real_image_field_inventory.py`
- evidence: script now exposes `build_field_inventory()` and `is_field_ready_for_tamper()` required by tests.

## E4: Targeted test passed

- command: `uvx --from pytest --with pillow pytest tests/test_insurance_fds_real_image_field_inventory.py -q --tb=short`
- exit_code: 0
- evidence: `2 passed in 0.19s`

## E5: Broader insurance FDS glob passed

- command: `uvx --from pytest --with pillow --with openpyxl --with requests pytest tests/test_insurance_fds_*.py -q --durations=12`
- exit_code: 0
- evidence: `29 passed in 27.21s`
- durations baseline:
  - priority pipeline tests: about 2.22-2.25s each
  - camera image generator tests: about 1.99-2.16s each
  - field pseudonymized pipeline: 1.94s

## E6: System handoff created

- command: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File J:/PortableApps/genai/handoff.ps1 "insurance-fds-field-inventory" "..."`
- exit_code: 0
- artifact_path: `documentation/session/handoffs/2026-06-07T12-12-02-975Z-codex-to-claude-system-insurance-fds-field-inventory.md`
