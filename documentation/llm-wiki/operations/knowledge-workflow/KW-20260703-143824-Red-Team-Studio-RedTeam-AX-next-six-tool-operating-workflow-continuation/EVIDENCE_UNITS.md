---
type: evidence_unit
status: draft
id:
project: Red-Team-Studio
created: 2026-07-03T14:38:24+09:00
---

# Evidence Unit

## Claim
RedTeam AX v2 now has a side-effect-safe six required-tool operating work order API and RedTeam2 UI table. It guides Nuclei/OpenVAS/Trivy/SCA/npm audit/OWASP ZAP next actions without executing scanners or marking the goal complete.

## Source

- source_type: code
- path_or_url: `J:/PortableApps/genai/projects/ai-agentic-soc/runtime/redteam_v2_models.py`
- command: `./.venv/Scripts/python.exe tests/test_redteam_v2_api_router.py`
- exit_code: 0
- collected_at: 2026-07-03T15:18:00+09:00
- source_type: frontend
- path_or_url: `J:/PortableApps/genai/projects/ai-agentic-soc/soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js`
- command: `node --check soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js`
- exit_code: 0
- collected_at: 2026-07-03T15:18:00+09:00

## Evidence
Backend route: `POST /api/redteam/v2/toolchains/six-tool-work-order`. Regression verifies six rows, OpenVAS/ZAP service import guidance, SCA import guidance, runner guidance, and safe flags. Frontend renders `6개 도구 작업 순서 만들기` and `작업 순서` table. Completion audit item `RTA-COMP-065` records the scope and residual gap.

## Confidence
High for API/UI contract and tests. The implementation is covered by targeted regression, full router regression, node syntax check, frontend sanity, Korean copy inventory, and completion audit sanity.

## Limits
This does not prove real organization OpenVAS/ZAP endpoint readiness, real six-tool outputs, Evidence approval, Finding severity approval, Report export, or completion gate closure.

## Related Decisions
Decision: add an operating work order guidance layer instead of executing high-risk tools automatically.
