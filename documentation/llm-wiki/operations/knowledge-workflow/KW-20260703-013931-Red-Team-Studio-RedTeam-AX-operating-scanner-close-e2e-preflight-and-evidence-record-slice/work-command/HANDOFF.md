# Handoff

## For Next Agent

Read these files first:

- `projects/ai-agentic-soc/runtime/redteam_v2_models.py`
- `projects/ai-agentic-soc/runtime/redteam_v2_api_router.py`
- `projects/ai-agentic-soc/tests/test_redteam_v2_api_router.py`
- `projects/ai-agentic-soc/soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js`
- `projects/ai-agentic-soc/Red Team Studio/고도화/completion-audit/redteam_ax_completion_audit_matrix.json`

## New API

- route: `/api/redteam/v2/toolchains/close-operating-artifact-manifest-e2e`
- input: `source_dir` or `artifacts`, plus explicit approvers
- output: `redteam_ax_v2_operating_toolchain_artifact_manifest_e2e_closure`

## Remaining Next Step

Run the endpoint against a real operator scanner-output folder with real approver identities after the environment and organization artifacts are ready.
