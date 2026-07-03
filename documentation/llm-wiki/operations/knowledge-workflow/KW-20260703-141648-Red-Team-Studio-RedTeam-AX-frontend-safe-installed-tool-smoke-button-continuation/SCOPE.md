---
type: scope
task_id: KW-20260703-141648-Red-Team-Studio-RedTeam-AX-frontend-safe-installed-tool-smoke-button-continuation
project: Red-Team-Studio
task: RedTeam AX frontend safe installed tool smoke button continuation
created: 2026-07-03T14:16:48+09:00
updated: 2026-07-03T14:45:00+09:00
---

# Scope

## Objective

Add a beginner-facing RedTeam2 button that runs the existing safe local version-only smoke path without requiring users to type runner commands manually.

## Included

- `executeRedTeam2SafeLocalSmokeToolchain()` frontend method.
- `안전 설치 확인 smoke` button.
- Frontend runtime sanity anchors for `safe_local_smoke_button`, version-only command generation, and active scan/Docker/WSL/network prohibition.
- FINAL_PLAN, Detailed_PLAN, LLM wiki, Markdown audit, and JSON audit matrix updates.

## Excluded

- Real vulnerability scans.
- OpenVAS/ZAP live endpoint import.
- Six-tool operating output collection.
- Evidence approval, Finding severity approval, Matrix, Report export, and completion gate closure.
- Marking the active goal complete.
