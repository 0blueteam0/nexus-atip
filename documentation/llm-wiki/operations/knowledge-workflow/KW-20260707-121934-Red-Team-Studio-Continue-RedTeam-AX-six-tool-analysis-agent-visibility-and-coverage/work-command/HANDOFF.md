# Handoff

- Changed backend coverage contract:
  - `analysis_agent_required_tool_ids`
  - `missing_analysis_agent_tool_ids`
  - `analysis_agent_required_tool_count`
  - `missing_analysis_agent_tool_count`
  - row-level `agent_status_ko`
- Changed frontend:
  - Korean summary row `필수 6개 에이전트 분석`.
  - Korean table `필수 6개 LLM 분석 에이전트`.
- Verified:
  - Python compile exit 0.
  - Node syntax exit 0.
  - focused pytest 2 passed exit 0.
  - frontend sanity scripts exit 0.
- Next agent should focus on installed/live tool evidence for all six tools.
