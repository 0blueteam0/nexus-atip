# Evidence Units

## EU-001 Backend API

- source_path: `projects/ai-agentic-soc/runtime/redteam_v2_models.py`
- source_path: `projects/ai-agentic-soc/runtime/redteam_v2_api_router.py`
- evidence: new operating artifact manifest E2E closure API and route
- safety: no scanner/Docker/WSL/network execution; existing files only

## EU-002 Frontend UI

- source_path: `projects/ai-agentic-soc/soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js`
- evidence: Korean source folder input, API copy, and `운영 산출물 전체 닫기` button

## EU-003 Regression

- source_path: `projects/ai-agentic-soc/tests/test_redteam_v2_api_router.py`
- evidence: six-tool fixture folder closes to `operating_collection_e2e_complete`
- key assertions: artifact_count=6, candidate_evidence_count=6, blocker_count=0, command execution flags false

## EU-004 Sanity and Audit

- source_path: `projects/ai-agentic-soc/Red Team Studio/고도화/sanity/redteam_ax_frontend_runtime_readiness_contract.py`
- source_path: `projects/ai-agentic-soc/Red Team Studio/고도화/sanity/test_redteam2_korean_copy_inventory.py`
- source_path: `projects/ai-agentic-soc/Red Team Studio/고도화/completion-audit/redteam_ax_completion_audit_matrix.json`
- evidence: Korean UI anchors and completion audit RTA-COMP-033

## EU-005 Accepted Gate

- artifact_path: `projects/ai-agentic-soc/archive/runs/redteam-ax-v2-accepted-gates/latest_accepted_gate_manifest.json`
- evidence: accepted_gate_count=24, passed_gate_count=24, failed_gate_count=0
