# Tasks

## Completed

- Inspected the live Report Studio `레드팀 분석2` page and confirmed the default analyst DOM still exposed administrator/runtime/path/closure details before the fix.
- Updated `reports.js` so `redteam2ShowAdminDetails` controls administrator detail rendering.
- Added a default-collapsed `관리자 설정` panel with `관리자 설정 보기` and `관리자 설정 숨기기`.
- Kept analyst-first workflow visible: `분석가용 다음 실행 안내` and `분석 결과 수집·검토 워크플로우`.
- Updated `FINAL_PLAN.md`, `Detailed_PLAN.MD`, `LLM_WIKI_HOME.md`, and completion audit artifacts with the default-collapse rule.
- Ran syntax, static sanity, JSON, completion audit, and Playwright browser verification.

## Remaining

- Inventory and reduce remaining English/internal tokens in the analyst default DOM.
- Run a real operating six-tool evidence closure with approved Nuclei/OpenVAS/Trivy/SCA/npm audit/ZAP outputs.
- Preserve final `/goal` status as active/incomplete until all real gates pass.
