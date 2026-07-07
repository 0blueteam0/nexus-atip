---
type: evidence_unit
status: draft
id: RTA-COMP-079-EVIDENCE
project: Red-Team-Studio
created: 2026-07-07T09:09:51+09:00
---

# Evidence Unit

## Claim

Report Studio shared header/tabs and RedTeam2 default analyst permission/report labels were localized to Korean-first copy, and the default RedTeam2 DOM no longer exposes the targeted legacy English/RBAC/API phrases.

## Source

- source_type: frontend_source
- path_or_url: `J:/PortableApps/genai/projects/ai-agentic-soc/soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js`
- command: `node --check J:/PortableApps/genai/projects/ai-agentic-soc/soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js`
- exit_code: 0
- collected_at: 2026-07-07T09:22:00+09:00

- source_type: sanity_test
- path_or_url: `J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/sanity/test_redteam2_korean_copy_inventory.py`
- command: `python .../test_redteam2_korean_copy_inventory.py`
- exit_code: 0
- collected_at: 2026-07-07T09:22:00+09:00

- source_type: browser_dom
- path_or_url: `J:/PortableApps/genai/documentation/llm-wiki/operations/knowledge-workflow/KW-20260707-090951-Red-Team-Studio-Continue-RedTeam-AX-goal-by-localizing-shared-Report-Studio-and-RedTeam2-remaini/browser/redteam2-shared-header-korean-after-20260707.json`
- command: `node .../browser/capture_redteam2_shared_header_korean.js`
- exit_code: 0
- collected_at: 2026-07-07T09:22:00+09:00

## Evidence

- Browser counts for old default labels: `Report Studio=0`, `Reports=0`, `Report catalog=0`, `Workflow, evidence=0`, `Objectives, campaigns=0`.
- Browser counts for old RedTeam2 permission/report labels: `케이스 RBAC 정책=0`, `RBAC 사용자=0`, `RBAC 역할=0`, `RBAC 불러오기=0`, `Report v2 초안 생성=0`, `API 호출 전에=0`, `Evidence 후보로 정규화=0`.
- Browser counts for replacement labels: `보고서 스튜디오=3`, `보고서 목록=1`, `케이스 권한 정책=1`, `권한 불러오기=2`, `보고서 v2 초안 생성=2`, `증거 연결표=4`, `최종 승인 게이트=1`.
- Korean copy inventory passed with English-only literal ratio 0.084.

## Confidence

High for default UI copy behavior because the proof combines source diff, static sanity tests, and fresh Playwright DOM evidence from Vite port 5177.

## Limits

This does not prove admin-expanded copy cleanup, legacy report template cleanup, global navigation cleanup, or live six-tool operating Evidence/Finding/Matrix/Report/export/completion gate closure.

## Related Decisions

- Keep backend payload keys and audit identifiers intact for traceability.
- Treat `RBAC` as acceptable in data/audit layers but avoid it in default analyst-facing labels.
