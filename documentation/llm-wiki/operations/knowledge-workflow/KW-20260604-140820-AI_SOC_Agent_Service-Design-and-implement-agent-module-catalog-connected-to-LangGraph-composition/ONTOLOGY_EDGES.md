# Ontology Edges

- AI_SOC_Agent_Service -> has_module_catalog -> ai_soc_agent_module_catalog_v1
- evidence_intake_agent -> owns_node -> ingest_evidence_package
- evidence_contract_agent -> owns_node -> validate_evidence_contract
- timeline_investigation_agent -> owns_node -> investigate_timeline
- mitre_context_agent -> owns_node -> map_mitre_context
- policy_guardrail_agent -> owns_node -> assess_guardrails
- analyst_brief_agent -> owns_node -> draft_human_review_brief
- replay_evaluation_agent -> feeds_back_to -> next_seed_go_hold_no_go
- LangGraph StateGraph -> enforces -> module_assurance
