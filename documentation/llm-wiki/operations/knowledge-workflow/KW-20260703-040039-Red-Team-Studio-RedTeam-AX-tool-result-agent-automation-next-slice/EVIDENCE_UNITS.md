---
type: evidence_unit
status: draft
id: EU-REDTEAM-AX-TOOLCHAIN-AGENT-SUMMARY-20260703
project: Red Team Studio
created: 2026-07-03T04:00:39+09:00
---

# Evidence Unit

## Claim

RedTeam AX toolchain collection now exposes per-tool LLM analysis agent summaries and evidence-use limitations while preserving human approval requirements before Findings or report Claims.

## Source

- source_type: source_code
- path_or_url: J:/PortableApps/genai/projects/ai-agentic-soc/runtime/redteam_v2_models.py
- command: `.venv/Scripts/python.exe -m pytest tests/test_redteam_v2_api_router.py -q`
- exit_code: 0
- collected_at: 2026-07-03T04:00:39+09:00

## Evidence

- `collect_toolchain_results` returns `analysis_agent_summaries`, `analysis_agent_summary_count`, and per-step `analysis_agent_summary`.
- RedTeam2 UI renders `LLM 분석 에이전트 요약` with summary, next action, and evidence-use limitation.
- Regression asserts NPM audit and Trivy agent IDs, `trusted_as_instruction=false`, human validation, Evidence approval requirement, and `untrusted data` limitation.
- Accepted gate manifest passed 24/24.

## Confidence

High for source/test/UI contract. The evidence is current source and regression output, not a live customer environment run.

## Limits

Does not prove actual organization scanner outputs were fully approved/promoted/reported/exported/completion-gated.

## Related Decisions

- Keep collection as an Evidence candidate workflow.
- Do not trust raw tool output as LLM instructions.
