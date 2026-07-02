---
type: evidence_unit
status: draft
id:
project: Red-Team-Studio
created: 2026-07-01T17:49:14+09:00
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

## EU-001 API Regression

- command: `python -m unittest discover -s tests -p "test_redteam_v2_api_router.py"`
- cwd: `J:\PortableApps\genai\projects\ai-agentic-soc`
- exit_code: 0
- result: `Ran 40 tests OK`
- verified_at: 2026-07-01T17:54+09:00

## EU-002 Sample E2E

- command: `python -m unittest tests.test_redteam_v2_sample_e2e`
- cwd: `J:\PortableApps\genai\projects\ai-agentic-soc`
- exit_code: 0
- result: `Ran 1 test OK`
- verified_at: 2026-07-01T17:54+09:00

## EU-003 Frontend Syntax

- command: `node --check projects/ai-agentic-soc/soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js`
- cwd: `J:\PortableApps\genai`
- exit_code: 0
- result: no syntax errors
- verified_at: 2026-07-01T17:54+09:00

## EU-004 Frontend Build

- command: `npm.cmd run build`
- cwd: `J:\PortableApps\genai\projects\ai-agentic-soc\soc-frontend-vite-react\soc-frontend\idiomatic-react`
- exit_code: 0
- result: Vite build succeeded; existing large chunk warning remains.
- verified_at: 2026-07-01T17:54+09:00

## EU-005 Plan Contract Sanity

- command: `python projects/ai-agentic-soc/Red Team Studio/고도화/sanity/test_plan_contract.py`
- cwd: `J:\PortableApps\genai`
- exit_code: 0
- result: `[+] plan contract sanity passed`
- verified_at: 2026-07-01T17:54+09:00
