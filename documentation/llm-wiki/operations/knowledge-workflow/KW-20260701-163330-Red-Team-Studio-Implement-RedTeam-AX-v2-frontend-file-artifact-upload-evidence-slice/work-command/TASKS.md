# Work Command Tasks

## Completed

- T1: Inspect RedTeam AX plan state and identify next unclosed implementation item.
  - Evidence: `FINAL_PLAN.md` Slice 20 and Slice 17/18/19 checklists showed multipart browser upload still incomplete.
- T2: Add backend multipart upload endpoint.
  - Evidence: `runtime/redteam_v2_api_router.py` now exposes `/tool-runs/{run_id}/import-file/upload`.
- T3: Preserve strict import invariants.
  - Evidence: `runtime/redteam_v2_models.py` writes upload bytes to `upload-inbox/<run_id>/` and calls `import_tool_run_file()`.
- T4: Add frontend upload UX.
  - Evidence: `reports.js` now computes browser SHA-256, creates governed offline parse run, uploads multipart form data, then calls sanitizer preview and agent analyze.
- T5: Add regression coverage.
  - Evidence: `test_v2_tool_run_multipart_upload_imports_file_and_feeds_agent_parser`.

## Remaining

- R1: Restart live backend and run browser upload smoke.
- R2: Implement image/OCR sensitive visual redaction preview.
- R3: Continue CLI/container runner version pin/hash verification.
