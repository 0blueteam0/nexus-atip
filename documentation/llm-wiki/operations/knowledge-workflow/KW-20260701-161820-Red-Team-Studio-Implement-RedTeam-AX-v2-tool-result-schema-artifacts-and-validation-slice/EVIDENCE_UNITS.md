---
type: evidence_unit
status: draft
id:
project: Red-Team-Studio
created: 2026-07-01T16:18:20+09:00
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
| EV-S18-001 | spec | `SPEC/29_TOOLING_SCHEMA_CONTRACTS.md` | ToolRunRecord and normalized output require explicit contracts. |
| EV-S18-002 | spec | `SPEC/33_TOOLING_ACCEPTANCE_TEST_PLAN.md` | Normalizers must produce consistent output and file hash requirements must be enforced. |
| EV-S18-003 | spec | `Agentic RAG SPEC/06_EVALUATION_SECURITY_OPERATIONS.md` | Schema gate requires all LLM JSON output schema validation pass. |
| EV-S18-004 | artifact | `Red Team Studio/고도화/schemas/json/ToolResultNormalized.schema.json` | Normalized result schema artifact added. |
| EV-S18-005 | artifact | `Red Team Studio/고도화/schemas/json/ToolArtifactImport.schema.json` | Artifact import schema artifact added. |
| EV-S18-006 | command | `py_compile ...`, exit_code=0 | Runtime/router/test compilation passed. |
| EV-S18-007 | command | `python -m unittest discover -s tests -p "test_redteam_v2_api_router.py"`, exit_code=0 | 30 v2 API tests passed. |
| EV-S18-008 | command | `python -m unittest discover -s tests -p "test_redteam_v2_sample_e2e.py"`, exit_code=0 | Sample E2E passed. |
| EV-S18-009 | command | `python "Red Team Studio/고도화/sanity/test_plan_contract.py"`, exit_code=0 | Plan contract sanity passed. |
| EV-S18-010 | command | `node --check .../reports.js`, exit_code=0 | Frontend syntax unchanged and valid. |
