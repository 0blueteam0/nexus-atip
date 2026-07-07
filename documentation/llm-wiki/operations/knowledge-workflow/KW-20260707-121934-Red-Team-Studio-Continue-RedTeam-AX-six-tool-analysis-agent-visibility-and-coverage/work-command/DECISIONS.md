# Decisions

- Decision: explicit agent coverage must be separate from tool-result coverage.
  - Evidence: `runtime/redteam_v2_models.py` now returns `analysis_agent_required_tool_ids` and `missing_analysis_agent_tool_ids`.
- Decision: frontend should show a Korean table instead of only raw IDs.
  - Evidence: `reports.js` includes `필수 6개 LLM 분석 에이전트`.
- Decision: completion gate should not be inferred from this slice.
  - Evidence: `FINAL_PLAN.md` leaves live execution, Evidence approval, Finding/Report/export gates open.
