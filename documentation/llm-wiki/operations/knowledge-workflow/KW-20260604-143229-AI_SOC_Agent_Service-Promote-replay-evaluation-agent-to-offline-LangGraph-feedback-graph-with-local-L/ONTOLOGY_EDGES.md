# Ontology Edges

- `replay_evaluation_agent` -> `implements` -> `offline_replay_feedback_langgraph`
- `offline_replay_feedback_langgraph` -> `consumes` -> `replay_metrics_v1.json`
- `offline_replay_feedback_langgraph` -> `consumes` -> `langgraph_seed_run_v1.json`
- `offline_replay_feedback_langgraph` -> `consumes` -> `agent_module_catalog_v1.json`
- `local_on_prem_llm` -> `replaces_later` -> `oauth_current_session_model`
- `oauth_current_session_model` -> `allowed_only_for` -> `redacted_synthetic_demo`
- `replay_feedback_report_v1.json` -> `records` -> `go_for_next_seed`
