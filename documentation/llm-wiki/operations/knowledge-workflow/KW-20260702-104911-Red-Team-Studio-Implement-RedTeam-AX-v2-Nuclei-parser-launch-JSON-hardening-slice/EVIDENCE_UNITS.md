---
type: evidence_unit
status: draft
id:
project: Red-Team-Studio
created: 2026-07-02T10:49:11+09:00
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

Claim: Implemented RedTeam AX v2 slice 35 Nuclei parser hardening. The Nuclei JSONL normalizer now skips JSON objects that have no Nuclei template identifier and no info block, preventing redteam_ax_v2_container_launch_plan artifacts from becoming weak scanner_finding_candidate items. The container stdout parser smoke now asserts exactly one scanner_finding_candidate for Nuclei, ZAP, and OpenVAS while preserving container_launch_evidence. FINAL_PLAN records slice 35 completion and keeps real Docker/Podman runtime smoke and live browser smoke pending.

Source:
- source_type: local_session
- path_or_url: J:\PortableApps\genai\documentation\llm-wiki\operations\knowledge-workflow\KW-20260702-104911-Red-Team-Studio-Implement-RedTeam-AX-v2-Nuclei-parser-launch-JSON-hardening-slice
- command: knowledge_workflow.py autofill
- exit_code: pending_until_close
- collected_at: 2026-07-02T10:50:46+09:00

Evidence artifacts:
- projects/ai-agentic-soc/runtime/redteam_v2_models.py
- projects/ai-agentic-soc/tests/test_redteam_v2_api_router.py
- projects/ai-agentic-soc/Red Team Studio/FINAL_PLAN.md

Command evidence:
- .venv/Scripts/python.exe -m unittest discover -s tests -p test_redteam_v2_api_router.py => exit_code 0, Ran 42 tests OK
- .venv/Scripts/python.exe -m unittest discover -s tests -p test_redteam_v2_sample_e2e.py => exit_code 0, Ran 1 test OK
- node --check soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js => exit_code 0
- .venv/Scripts/python.exe Red Team Studio/고도화/sanity/test_plan_contract.py => exit_code 0, plan contract sanity passed

Limits:
- This slice hardens dry-run parser quality; real Docker/Podman runtime stdout/stderr smoke remains pending.
