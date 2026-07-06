---
type: evidence_unit
status: ready_for_close
id: EU-REDTEAM2-ADMIN-COLLAPSE-20260706
project: Red-Team-Studio
created: 2026-07-06T12:24:34+09:00
updated: 2026-07-06T12:47:03+09:00
---

# Evidence Unit

## Claim

RedTeam2 기본 분석가 화면은 관리자/runtime/path/closure 세부정보를 기본 DOM에서 접고, 분석가용 다음 행동과 결과 수집·검토 workflow를 먼저 보여준다.

## Source

- source_type: source code
  - path_or_url: `J:/PortableApps/genai/projects/ai-agentic-soc/soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js`
  - collected_at: 2026-07-06T12:47:03+09:00
- source_type: browser artifact
  - path_or_url: `J:/PortableApps/genai/documentation/llm-wiki/operations/knowledge-workflow/KW-20260706-122434-Red-Team-Studio-Continue-RedTeam-AX-goal-browser-verify-and-simplify-RedTeam2-analyst-workflow/browser/redteam2-browser-verify-20260706.json`
  - command: Playwright opened `http://127.0.0.1:5177` -> `보고서 스튜디오` -> `레드팀 분석2`
  - exit_code: 0
  - collected_at: 2026-07-06T12:47:03+09:00
- source_type: sanity tests
  - command: `node --check reports.js`; exit_code: 0
  - command: `python redteam_ax_frontend_runtime_readiness_contract.py`; exit_code: 0
  - command: `python redteam_ax_frontend_launch_readiness_contract.py`; exit_code: 0
  - command: `python test_redteam2_korean_copy_inventory.py`; exit_code: 0
  - command: `python redteam_ax_toolchain_collection_analyst_summary_contract.py`; exit_code: 0
  - command: `python test_completion_audit_matrix.py`; exit_code: 0

## Evidence

- `redteam2ShowAdminDetails` defaults to false because only explicit true opens admin details.
- RedTeam2 renders a `관리자 설정` panel with `관리자 설정 보기`/`관리자 설정 숨기기`.
- Browser verification result: `hits=[]`, `missing=[]`, DOM length `10451`.
- Completion audit matrix added `RTA-COMP-075` with the browser artifact as evidence.

## Confidence

High for default visible DOM behavior at `http://127.0.0.1:5177` on 2026-07-06. The evidence combines source patch, browser DOM verification, screenshot/body artifact, and static sanity contracts.

## Limits

- Administrator details intentionally remain available after expanding the toggle.
- Backend payload keys and Evidence artifact paths are preserved for audit traceability.
- This does not prove final RedTeam AX goal completion or real six-tool operating closure.

## Related Decisions

- Decision: collapse rather than delete administrator details.
- Decision: use browser DOM forbidden-term verification for default analyst view.
