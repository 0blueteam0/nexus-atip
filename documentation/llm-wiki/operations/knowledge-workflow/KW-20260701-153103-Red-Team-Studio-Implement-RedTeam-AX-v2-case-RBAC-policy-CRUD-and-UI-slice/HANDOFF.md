---
type: handoff
status: complete
project: Red Team Studio
updated: 2026-07-01T16:21:00+09:00
---

# Handoff

## 현재 상태

Slice 14 Case RBAC Policy CRUD/Admin UI is implemented and locally verified. The broader RedTeam AX goal remains active.

## 완료된 것

- Backend case RBAC policy CRUD endpoints.
- Artifact-backed policy override and assignment validation.
- Actor context `case_policy_source` reflects active artifact policy.
- `레드팀 분석2` Case RBAC Policy panel with Load/Apply/Add controls.
- `FINAL_PLAN.md` updated with slice 14 checklist.

## 검증된 것

- `.venv/Scripts/python.exe -m unittest discover -s tests -p "test_redteam_v2_api_router.py"`: 24 tests OK.
- `.venv/Scripts/python.exe -m unittest discover -s tests -p "test_redteam_v2_sample_e2e.py"`: 1 test OK.
- `.venv/Scripts/python.exe -m unittest discover -s tests -p "test_redteam_api_router.py"`: 2 tests OK.
- `node --check src/store/methods/reports.js`: exit 0.
- `npm.cmd run build`: exit 0.
- Live 8765 smoke: active policy and approved T3 actor source `case_policy_artifact`.
- Live 5177 Playwright smoke screenshot: `Red Team Studio/고도화/live-smoke/redteam2-rbac-crud-export-flow.png`.

## 아직 위험한 것

- External SSO/IdP validation and central group sync are not implemented.
- UI has add/apply/load but not a row-level delete control yet, even though backend DELETE is implemented and tested.
- Full release/security/starter-pack regression remains open.

## 열린 질문

- Central RBAC source should be IdP group membership, project-local user registry, or both with precedence rules?
- Should case policy edits require Executive Sponsor approval before becoming active?

## 다음 액션

1. Implement central user/group sync adapter and source metadata.
2. Add row-level RBAC assignment delete/edit UI with audit event display.
3. Add Finding owner/SLA/retest workflow UI.
4. Run full release/security/starter-pack regression.

## 반드시 읽을 문서

- `J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/FINAL_PLAN.md`
- `J:/PortableApps/genai/projects/ai-agentic-soc/runtime/redteam_v2_models.py`
- `J:/PortableApps/genai/projects/ai-agentic-soc/runtime/redteam_v2_api_router.py`
- `J:/PortableApps/genai/projects/ai-agentic-soc/soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js`

## 관련 도구와 스크립트

- `.venv/Scripts/python.exe -m unittest discover -s tests -p "test_redteam_v2_api_router.py"`
- `npm.cmd run build`
- `Red Team Studio/고도화/sanity/test_plan_contract.py`

## 다시 논의하지 않아도 되는 결정

- Case RBAC policy는 현재 artifact-backed override로 구현한다.
- Actor context에는 authorization source metadata를 반드시 남긴다.
