# Decision Log

1. Keep current LangGraph investigation graph connector-free and action-free.
2. Add `replay_evaluation_agent` to the module catalog but do not insert it into the live LangGraph StateGraph invocation path yet.
3. Require every LangGraph node to have a module owner and assert that in tests and execution assurance.
4. Treat LLM/ML/connectors as future candidate backends behind module contracts, not current behavior.
