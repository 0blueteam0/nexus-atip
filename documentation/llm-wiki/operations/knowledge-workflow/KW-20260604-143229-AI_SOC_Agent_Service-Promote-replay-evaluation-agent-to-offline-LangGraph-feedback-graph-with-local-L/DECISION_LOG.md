# Decision Log

## D1: Local LLM first, OAuth fallback only for demo

Decision: Use `local_on_prem_llm` as the default/production target and `oauth_current_session_model` as a demo fallback contract only.

Reason: User expects on-premise local model replacement later, but wants to know if current GPT-5.5/OAuth model can stand in for demos.

Consequence: The seed records backend policy but performs no live LLM call.

## D2: Offline feedback graph first

Decision: Promote `replay_evaluation_agent` into its own offline LangGraph feedback graph before implementing live model-backed agent nodes.

Reason: This gives deterministic go/hold/no-go and module ranking for safe incremental multi-agent workflow expansion.

## D3: Detailed Korean code comments

Decision: Add detailed Korean comments/docstrings to new workflow code and save this as durable user preference.

Reason: User will fine-tune each workflow later and wants the code to be self-explanatory in Korean.
