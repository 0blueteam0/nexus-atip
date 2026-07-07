---
type: evidence_unit
status: draft
id:
project: Red Team Studio
created: 2026-07-07T12:37:28+09:00
---

# Evidence Unit

## Claim

RedTeam AX now exposes a broader SPEC 24-aligned official-source install candidate catalog while preserving non-execution guardrails.

## Source

- source_type: local_spec
- path_or_url: projects/ai-agentic-soc/Red Team Studio/SPEC/24_OPEN_SOURCE_TOOL_INTEGRATION_CATALOG.md
- command: rg focused SPEC inspection
- exit_code: 0
- collected_at: 2026-07-07T12:40:00+09:00

- source_type: product_code
- path_or_url: projects/ai-agentic-soc/runtime/redteam_v2_models.py
- command: local file edit and py_compile
- exit_code: 0
- collected_at: 2026-07-07T12:47:00+09:00

- source_type: backend_test
- path_or_url: projects/ai-agentic-soc/tests/test_redteam_v2_api_router.py
- command: pytest -k tool_install_readiness_exposes_operator_run_install_plans
- exit_code: 0
- collected_at: 2026-07-07T12:47:00+09:00

## Evidence

- `DISCOVERED_TOOL_INSTALL_CANDIDATES` includes SpiderFoot, subfinder, httpx, GoWitness, EyeWitness, Nettacker, BloodHound CE, PingCastle, Certipy, Stratus, Caldera, Atomic Red Team, OpenBAS, VECTR, Attack Flow, Timesketch, Velociraptor, Sigma CLI, PyRIT, garak, Inspect AI, and AgentDojo.
- Each new candidate remains `commands_executed_by_api=false` and `trusted_as_instruction=false`.
- Targeted backend regression passed and checks candidate count, representative names, official source basis, and non-execution flags.
- Frontend runtime and launch readiness sanity scripts passed.

## Confidence

High for catalog/API contract implementation. Low for actual installation/execution completion because that is explicitly out of scope for this slice.

## Limits

No installers were executed. No new candidate was promoted to executable ToolProfile. No tool results were collected from the new candidates.

## Related Decisions

- D1: Broaden candidate catalog but keep execution disabled.
- D2: Official source basis required for candidate metadata.
