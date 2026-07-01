---
type: evidence_unit
status: draft
id:
project: Red-Team-Studio
created: 2026-07-01T16:11:57+09:00
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

# Evidence Units

| ID | Type | Evidence | Result |
|---|---|---|---|
| EV-S17-001 | spec | `Red Team Studio/SPEC/28_TOOL_RESULT_EVIDENCE_AND_REPORTING_SPEC.md` | Raw output must normalize before evidence/report use. |
| EV-S17-002 | spec | `Red Team Studio/SPEC/29_TOOLING_SCHEMA_CONTRACTS.md` | ToolRunRecord raw artifacts and normalized results are required contracts. |
| EV-S17-003 | spec | `Red Team Studio/SPEC/33_TOOLING_ACCEPTANCE_TEST_PLAN.md` | TST-EVID-003 requires output file lacking hash to be rejected. |
| EV-S17-004 | command | `py_compile runtime/redteam_v2_models.py runtime/redteam_v2_api_router.py tests/test_redteam_v2_api_router.py`, exit_code=0 | Syntax/import compilation passed. |
| EV-S17-005 | command | `python -m unittest discover -s tests -p "test_redteam_v2_api_router.py"`, exit_code=0 | 29 v2 API tests passed. |
| EV-S17-006 | command | `python -m unittest discover -s tests -p "test_redteam_v2_sample_e2e.py"`, exit_code=0 | Sample v2 E2E test passed. |
| EV-S17-007 | command | `python "Red Team Studio/고도화/sanity/test_plan_contract.py"`, exit_code=0 | Plan contract sanity passed. |
