# Handoff

## Start Here

Read these files first:

- `projects/ai-agentic-soc/runtime/redteam_v2_models.py`
- `projects/ai-agentic-soc/runtime/redteam_v2_api_router.py`
- `projects/ai-agentic-soc/tests/test_redteam_v2_api_router.py`
- `projects/ai-agentic-soc/Red Team Studio/FINAL_PLAN.md`
- `projects/ai-agentic-soc/Red Team Studio/고도화/llm-wiki/LLM_WIKI_HOME.md`

## Current State

The Matrix draft API is implemented and tested. It can hold candidates before approvals and mark rows ready after Evidence approval plus two-person Finding severity approval.

## Verification

- Full v2 API regression: 56 passed.
- Accepted gate manifest: 24/24 passed.
- Frontend runtime readiness contract: passed.
- Korean copy inventory: passed.

## Next Operator Action

Use real approved Evidence Cards and approved Findings, then run the Matrix draft API for all candidates before generating the report.
