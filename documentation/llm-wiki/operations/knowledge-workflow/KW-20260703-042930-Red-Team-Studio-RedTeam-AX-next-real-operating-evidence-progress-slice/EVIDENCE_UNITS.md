---
type: evidence_unit
status: draft
id: EU-REDTEAM-AX-SIX-TOOL-COVERAGE-20260703
project: Red Team Studio
created: 2026-07-03T04:29:30+09:00
---

# Evidence Unit

## Claim

Real operating evidence readiness now requires complete Nuclei/OpenVAS/Trivy/SCA/npm audit/OWASP ZAP artifact coverage before operating closure submission readiness.

## Source

- source_type: source_code_and_regression
- path_or_url: J:/PortableApps/genai/projects/ai-agentic-soc/runtime/redteam_v2_models.py
- command: `.venv/Scripts/python.exe -m pytest tests/test_redteam_v2_api_router.py -q`
- exit_code: 0
- collected_at: 2026-07-03T04:29:30+09:00

## Evidence

- Manifest builder emits `tool_coverage`, `present_tool_ids`, `missing_tool_ids`, `tool_coverage_complete`.
- Real-operating readiness returns `all_required_tool_artifacts_required` and `missing_required_tool_ids` when six-tool coverage is incomplete.
- Regression verifies two-artifact fixture is blocked and six-artifact folder becomes readiness-complete without executing scanners.

## Confidence

High for source/test/UI contract.

## Limits

This does not prove real organization artifacts exist or that downstream closure/report/export gates are complete.

## Related Decisions

- Require all six named tool outputs by default for operating closure readiness.
