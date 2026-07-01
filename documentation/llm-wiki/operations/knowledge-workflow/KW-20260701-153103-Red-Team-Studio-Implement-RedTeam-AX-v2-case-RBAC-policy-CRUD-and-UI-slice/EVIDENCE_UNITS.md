---
type: evidence_unit
status: complete
id: EU-REDTEAM-AX-CASE-RBAC-CRUD-20260701
project: Red Team Studio
created: 2026-07-01T15:31:03+09:00
updated: 2026-07-01T16:21:00+09:00
---

# Evidence Unit

## Claim

RedTeam AX v2 now supports persisted case RBAC policy CRUD, applies active case policy artifacts to approval actor context, and exposes a `레드팀 분석2` Case RBAC Policy UI.

## Source

- source_type: code
- path_or_url: `J:/PortableApps/genai/projects/ai-agentic-soc/runtime/redteam_v2_models.py`
- path_or_url: `J:/PortableApps/genai/projects/ai-agentic-soc/runtime/redteam_v2_api_router.py`
- path_or_url: `J:/PortableApps/genai/projects/ai-agentic-soc/soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js`
- command: `.venv/Scripts/python.exe -m unittest discover -s tests -p "test_redteam_v2_api_router.py"`
- exit_code: 0
- command: `npm.cmd run build`
- exit_code: 0
- collected_at: 2026-07-01T16:21:00+09:00

## Evidence

- API tests: 24 RedTeam v2 router tests OK, including case RBAC CRUD and invalid role mismatch.
- Sample E2E: 1 test OK.
- Legacy redteam router regression: 2 tests OK.
- Live API smoke: valid policy returned `status=active`, approval returned `status=Approved`, `identity=bound`, `actor_source=case_policy_artifact`.
- Playwright UI smoke: `레드팀 분석2`, `Case RBAC Policy`, default actor, and `case_policy_artifact` input value all present.
- Screenshot: `J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/live-smoke/redteam2-rbac-crud-export-flow.png`.

## Confidence

High for local dev platform behavior. The implementation is covered by unit tests, source checks, production build, live backend smoke, and live frontend browser smoke.

## Limits

External SSO/IdP provider, central user/group sync, and full release/security/starter-pack regression are not completed in this slice.

## Related Decisions

- DEC-CASE-RBAC-ARTIFACT-CRUD
- DEC-ACTOR-CONTEXT-POLICY-SOURCE
