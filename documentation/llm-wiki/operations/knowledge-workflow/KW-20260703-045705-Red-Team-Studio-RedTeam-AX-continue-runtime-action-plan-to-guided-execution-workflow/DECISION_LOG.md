# Decision Log

- Decision: Add UI button mapping fields to runtime next_action_plan instead of hardcoding all mapping only in the frontend.
- Reason: Backend readiness owns the sequence and can expose stable `frontend_action_key`; frontend renders Korean labels and keeps behavior explicit.
- Safety: Mapping fields are descriptive; they do not execute tools or bypass HITL/ROE/guardrails.
- Residual gap: Real operator button clicks, real scanner outputs, Evidence approval, Finding/Matrix/Report/export, and completion audit remain required.
