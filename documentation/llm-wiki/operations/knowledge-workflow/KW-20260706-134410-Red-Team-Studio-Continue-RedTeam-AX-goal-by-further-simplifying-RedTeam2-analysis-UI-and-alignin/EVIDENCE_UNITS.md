---
type: evidence_unit
status: draft
id:
project: Red-Team-Studio
created: 2026-07-06T13:44:10+09:00
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

| id | type | artifact_path | source_path | verified_at | result |
|---|---|---|---|---|---|
| EV-001 | code | J:/PortableApps/genai/projects/ai-agentic-soc/soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js | SPEC/25, SPEC/27, Agentic RAG SPEC/03 | 2026-07-06T13:52:08+09:00 | RedTeam2 default workflow labels localized and internal terms reduced |
| EV-002 | browser | J:/PortableApps/genai/documentation/llm-wiki/operations/knowledge-workflow/KW-20260706-134410-Red-Team-Studio-Continue-RedTeam-AX-goal-by-further-simplifying-RedTeam2-analysis-UI-and-alignin/browser/redteam2-default-dom-analyst-terms-after-20260706-134410.json | http://127.0.0.1:5177/reports | 2026-07-06T13:52:08+09:00 | forbidden_default_hits=[]; coverage/smoke/runner/toolchain/raw API counts 0 |
| EV-003 | test | command output | sanity/test_redteam2_korean_copy_inventory.py | 2026-07-06T13:52+09:00 | passed; English-only ratio=0.0891 |
| EV-004 | test | command output | sanity/redteam_ax_frontend_runtime_readiness_contract.py | 2026-07-06T13:52+09:00 | passed |
| EV-005 | test | command output | sanity/redteam_ax_frontend_launch_readiness_contract.py | 2026-07-06T13:51+09:00 | passed |
| EV-006 | audit | J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/completion-audit/redteam_ax_completion_audit_matrix.json | RTA-COMP-078 | 2026-07-06T13:52+09:00 | JSON valid; completion audit sanity passed |
