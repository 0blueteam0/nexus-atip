# Tool Decision

- Used unittest because implementation_seed already uses Python unittest.
- Used actual LangGraph package after user clarified tool installation is desired when necessary.
- Used contract-only OTRF builder to avoid raw public dataset access before approval/license review.
- Used cronjob for parallel Hermes Kanban/LangGraph UX exploration because it is durable and independent from the foreground AI_SOC implementation.
