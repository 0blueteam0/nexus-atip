# Tooling

## Commands Used

- `node --check reports.js`
- `python redteam_ax_frontend_runtime_readiness_contract.py`
- `python redteam_ax_frontend_launch_readiness_contract.py`
- `python test_redteam2_korean_copy_inventory.py`
- `python redteam_ax_toolchain_collection_analyst_summary_contract.py`
- `python test_completion_audit_matrix.py`
- `python -m json.tool redteam_ax_completion_audit_matrix.json`
- Playwright browser verification against `http://127.0.0.1:5177`

## Tooling Notes

The first browser verification failed because the temporary script could not resolve the Playwright module. Re-running from the frontend package and requiring `./node_modules/playwright` fixed module resolution. The final browser check passed and wrote JSON/text/screenshot evidence.

## Artifacts

- `browser/redteam2-browser-verify-20260706.json`
- `browser/redteam2-browser-verify-20260706.txt`
- `browser/redteam2-browser-verify-20260706.png`
