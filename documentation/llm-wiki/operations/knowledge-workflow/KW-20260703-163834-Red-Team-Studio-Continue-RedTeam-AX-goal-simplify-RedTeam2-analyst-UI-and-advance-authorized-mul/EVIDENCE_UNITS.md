---
type: evidence_unit
status: draft
id:
project: Red-Team-Studio
created: 2026-07-03T16:38:34+09:00
---

# Evidence Unit

## Claim

RedTeam2 복합 도구 영역은 실행 목록 중심 표현에서 결과 수집·검토 워크플로우 중심 표현으로 바뀌었다.

## Source

- source_type: code
- path_or_url: J:/PortableApps/genai/projects/ai-agentic-soc/soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js
- command: rg -n "분석 결과 수집·검토 워크플로우|상세 실행 기록\\(관리자/감사용\\)|상세 진행 기록\\(관리자/감사용\\)" reports.js
- exit_code: 0
- collected_at: 2026-07-06T00:00:00+09:00

- source_type: code
- path_or_url: J:/PortableApps/genai/projects/ai-agentic-soc/runtime/redteam_v2_models.py
- command: rg -n "analyst_finding_review_summary|_toolchain_analyst_finding_review_summary|raw_paths_hidden_from_analyst" redteam_v2_models.py
- exit_code: 0
- collected_at: 2026-07-06T00:00:00+09:00

- source_type: test
- path_or_url: J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/sanity/redteam_ax_toolchain_collection_analyst_summary_contract.py
- command: python redteam_ax_toolchain_collection_analyst_summary_contract.py
- exit_code: pending
- collected_at: 2026-07-06T00:00:00+09:00

## Evidence

- Frontend heading now uses `분석 결과 수집·검토 워크플로우`.
- Analyst tables now include `분석 결과 쉬운 요약`, `도구별 분석 요약`, and demote raw execution/progress to administrator/audit detail tables.
- Backend collect-results now emits `analyst_finding_review_summary` containing candidate counts, severity distribution, Evidence status, review priority, missing tool rows, and traceability note.

## Confidence

Medium until sanity tests and knowledge workflow close gate pass.

## Limits

This does not prove live six-tool operating outputs, browser visual regression, Evidence approval, Finding severity approval, Report v2 export, or final completion gate closure.

## Related Decisions

- Decision: preserve approved runner capability but make result review the analyst-facing primary workflow.
