---
type: evidence_unit
status: draft
id:
project: Red-Team-Studio
created: 2026-07-01T16:23:40+09:00
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
| EV-S19-001 | spec | `SPEC/20_GUARDRAIL_ACCEPTANCE_TEST_PLAN.md` | GT-OUTPUT-001 and GT-OUTPUT-002 define quarantine/redaction behavior. |
| EV-S19-002 | spec | `SPEC/18_GUARDRAIL_ENGINE_DESIGN.md` | ToolOutputSanitizer flow requires raw store, prompt scan, PII/secret scan, redaction, sanitized store. |
| EV-S19-003 | spec | `SPEC/21_GUARDRAIL_AGENT_PROMPTS.md` | Tool output is untrusted data, never instruction. |
| EV-S19-004 | command | `py_compile ...`, exit_code=0 | Runtime/router/test compilation passed. |
| EV-S19-005 | command | `python -m unittest discover -s tests -p "test_redteam_v2_api_router.py"`, exit_code=0 | 31 v2 API tests passed. |
| EV-S19-006 | command | `python -m unittest discover -s tests -p "test_redteam_v2_sample_e2e.py"`, exit_code=0 | Sample E2E passed. |
| EV-S19-007 | command | `python "Red Team Studio/고도화/sanity/test_plan_contract.py"`, exit_code=0 | Plan sanity passed. |
| EV-S19-008 | command | `node --check .../reports.js`, exit_code=0 | Frontend syntax passed. |
