---
type: evidence_unit
status: complete
id: EU-REDTEAM-AX-TOOLHUB-AGENTS-20260701
project: Red Team Studio
created: 2026-07-01T15:44:33+09:00
updated: 2026-07-01T16:03:00+09:00
---

# Evidence Unit

## Claim

RedTeam AX v2 now has a governed ToolHub foundation for Nuclei, OpenVAS, Trivy, SCA, npm audit, and OWASP ZAP, with per-tool LLM analysis agents and evidence-first execution gates.

## Source

- source_type: code
- path_or_url: `J:/PortableApps/genai/projects/ai-agentic-soc/runtime/redteam_v2_models.py`
- path_or_url: `J:/PortableApps/genai/projects/ai-agentic-soc/runtime/redteam_v2_api_router.py`
- path_or_url: `J:/PortableApps/genai/projects/ai-agentic-soc/tests/test_redteam_v2_api_router.py`
- path_or_url: `J:/PortableApps/genai/projects/ai-agentic-soc/soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js`
- command: `.venv/Scripts/python.exe -m unittest discover -s tests -p "test_redteam_v2_api_router.py"`
- exit_code: 0
- collected_at: 2026-07-01T16:03:00+09:00

## Evidence

- Registry API returned `tool_count=6` and `agent_count=6` in live smoke.
- Active scanner Nuclei returned `approval_required_before_tool_execution` before approval.
- Approved Nuclei flow returned `OutputImported`, `AGENT-NUCLEI-ANALYST-001`, `Normalized`, and `trusted_as_instruction=false`.
- UI smoke confirmed ToolHub panel, Nuclei, OWASP ZAP, agent, and trust policy.
- Screenshot: `Red Team Studio/고도화/live-smoke/redteam2-toolhub-agent-registry.png`.

## Confidence

High for registry, policy gate, artifact-backed run record, and UI visibility. Medium for actual tool execution readiness because CLI/container installation and parser-specific adapters are intentionally deferred.

## Limits

This slice does not install or run real scanners against targets. It implements governed integration foundations and safe import/normalize paths.

## Related Decisions

- DEC-TOOLHUB-FOUNDATION-FIRST
- DEC-ACTIVE-SCANNER-APPROVAL-GATE
