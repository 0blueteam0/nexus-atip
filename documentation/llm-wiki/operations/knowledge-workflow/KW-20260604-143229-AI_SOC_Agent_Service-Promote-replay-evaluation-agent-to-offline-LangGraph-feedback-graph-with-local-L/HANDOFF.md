# Handoff

Next recommended foreground increment:
1. Add a redacted prompt-contract node for `analyst_brief_agent`, still dry-run by default.
2. Keep `selected_for_seed=none_dry_run` until a deliberate demo run flag exists.
3. If enabling demo OAuth model calls, add tests that default mode never calls live LLM and only explicit demo mode can use redacted/synthetic input.
4. When local LLM is ready, implement adapter under `module_backend_contract` without changing replay artifact contracts.

Important files:
- `A3Work/AI_SOC_Agent_Service/implementation_seed/scripts/replay_feedback_graph.py`
- `A3Work/AI_SOC_Agent_Service/implementation_seed/tests/test_replay_feedback_graph.py`
- `A3Work/AI_SOC_Agent_Service/implementation_seed/reports/replay_feedback_report_v1.json`
- `A3Work/AI_SOC_Agent_Service/implementation_seed/EVALUATION_PROTOCOL.md`
