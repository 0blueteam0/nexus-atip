# Decisions

1. Use LangGraph `StateGraph` for the replay feedback workflow, not an ad-hoc JSON-only planner.
2. Keep LLM execution disabled in default tests and artifacts.
3. Treat `local_on_prem_llm` as the production target backend.
4. Treat `oauth_current_session_model` / GPT-5.5 as a demo fallback contract only, limited to redacted or synthetic data.
5. Add detailed Korean comments to new workflow code because the user plans to fine-tune workflows manually.
