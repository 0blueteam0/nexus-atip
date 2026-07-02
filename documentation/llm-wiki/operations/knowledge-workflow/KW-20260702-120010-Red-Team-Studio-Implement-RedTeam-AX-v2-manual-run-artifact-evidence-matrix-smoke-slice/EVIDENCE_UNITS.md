---
type: evidence_unit
status: draft
id:
project: Red-Team-Studio
created: 2026-07-02T12:00:10+09:00
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



## Autofill Evidence Unit

Claim: Slice 43 implemented RedTeam AX v2 live manual-run artifact Evidence Card and Claim-Evidence Matrix smoke. The slice uses SPEC and Agentic RAG SPEC as the authoritative requirements for evidence-first claim/citation validation. The live browser smoke now has an explicit --allow-evidence-matrix opt-in that requires approval grant, records approved operator-provided artifacts, imports and normalizes ToolRunRecord output, creates and approves an Evidence Card candidate, generates a Korean Red Team Report v2 draft with a supported claim linked to the approved evidence, and verifies report gate counts are zero without clicking or executing the governed runner.

Source:
- source_type: local_session
- path_or_url: J:\PortableApps\genai\documentation\llm-wiki\operations\knowledge-workflow\KW-20260702-120010-Red-Team-Studio-Implement-RedTeam-AX-v2-manual-run-artifact-evidence-matrix-smoke-slice
- command: knowledge_workflow.py autofill
- exit_code: pending_until_close
- collected_at: 2026-07-02T12:08:56+09:00

Evidence artifacts:
- J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/SPEC
- J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/Agentic RAG SPEC
- J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/sanity/redteam_ax_live_browser_parser_smoke.py
- J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-browser-smoke/latest_live_browser_parser_smoke.json
- J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/FINAL_PLAN.md

Command evidence:
- python -m py_compile Red Team Studio/고도화/sanity/redteam_ax_live_browser_parser_smoke.py :: exit_code=0
- python Red Team Studio/고도화/sanity/redteam_ax_live_browser_parser_smoke.py --allow-browser --allow-action --allow-approval-request --allow-evidence-matrix --require-live :: exit_code=1 expected blocker=evidence_matrix_smoke_requires_allow_approval_grant
- python Red Team Studio/고도화/sanity/redteam_ax_live_browser_parser_smoke.py --allow-browser --allow-action --allow-approval-request --allow-approval-grant --allow-evidence-matrix --require-live :: exit_code=0 status=passed blockers=[] evidenceMatrixLinked=true
- python tests/test_redteam_v2_api_router.py :: exit_code=0 Ran 42 tests OK
- python tests/test_redteam_v2_sample_e2e.py :: exit_code=0 Ran 1 test OK
- python Red Team Studio/고도화/sanity/test_plan_contract.py :: exit_code=0

Limits:
- Next slice should implement Agentic RAG SPEC corpus routing/SCA/citation verifier API smoke connected to the RedTeam AX evidence store. Full objective remains incomplete; no governed runner execution was performed.
