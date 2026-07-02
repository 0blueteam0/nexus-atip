# Ontology Edges

- runtime_readiness_status -> emits -> next_action_plan
- next_action_plan -> contains -> operator_action_ko
- next_action_plan -> gates -> tool_execution_ready
- tool_execution_blocked_by -> explains -> blocked_real_tool_execution
- RedTeam2_runtime_panel -> displays -> next_action_plan
