# Evidence Units

| ID | Type | Source | Evidence | Status |
|---|---|---|---|---|
| EV-S21-001 | source_change | `runtime/redteam_v2_api_router.py` | Added `POST /tool-runs/{run_id}/import-file/upload` using `UploadFile`, `Form`, and `File`. | verified |
| EV-S21-002 | source_change | `runtime/redteam_v2_models.py` | Added `import_tool_run_uploaded_file()` bridge to `upload-inbox/<run_id>/` and strict `import_tool_run_file()`. | verified |
| EV-S21-003 | source_change | `reports.js` | Added browser SHA-256, multipart upload, sanitizer preview, agent analyze, and UI status panel. | verified |
| EV-S21-004 | test | `tests/test_redteam_v2_api_router.py` | Added multipart upload regression test for Nuclei JSONL stored artifact parsing. | verified |
| EV-S21-005 | command | `node --check ...reports.js` | exit_code=0 | passed |
| EV-S21-006 | command | `python -m unittest discover -s tests -p "test_redteam_v2_api_router.py"` | exit_code=0, 32 tests OK | passed |
| EV-S21-007 | command | `python -m unittest discover -s tests -p "test_redteam_v2_sample_e2e.py"` | exit_code=0, 1 test OK | passed |
| EV-S21-008 | command | `npm.cmd run build` | exit_code=0 | passed |
| EV-S21-009 | command | `test_plan_contract.py` | exit_code=0 | passed |

## Residual Evidence Gap

Live browser upload smoke against `127.0.0.1:5177`/`127.0.0.1:8765` was not completed in this slice. `FINAL_PLAN.md` records this as a remaining item because the previous turn observed stale backend risk on port 8765.
