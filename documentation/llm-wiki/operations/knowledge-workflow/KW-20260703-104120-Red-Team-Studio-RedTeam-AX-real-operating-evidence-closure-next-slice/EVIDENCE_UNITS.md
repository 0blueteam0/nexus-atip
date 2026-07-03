---
type: evidence_unit
status: final
project: Red Team Studio
created: 2026-07-03T10:41:20+09:00
---

# Evidence Units

## EU-001

- claim: Operating closure submission package now classifies development byproduct sources.
- source_type: code
- path_or_url: `J:/PortableApps/genai/projects/ai-agentic-soc/runtime/redteam_v2_models.py`
- evidence: `source_completion_review`, `completion_evidence_allowed`, `report_claim_evidence_allowed`, `development_byproduct_exclusion`.
- limits: This blocks byproduct sources; it does not create real operating evidence.

## EU-002

- claim: RedTeam2 sends strict real completion evidence mode and renders Korean byproduct exclusion.
- source_type: frontend
- path_or_url: `J:/PortableApps/genai/projects/ai-agentic-soc/soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js`
- evidence: `require_real_completion_evidence:true`, `개발 부산물 제외`, `완료/보고서 Claim 증거로 사용하지 않습니다`.
- limits: UI contract only; operator still must provide real approved artifacts.

## EU-003

- claim: API regression proves strict byproduct blocking.
- source_type: command
- command: `.venv/Scripts/python.exe -m pytest tests/test_redteam_v2_api_router.py::RedTeamV2ApiRouterTests::test_v2_operating_closure_submission_package_strict_mode_excludes_development_byproducts -q`
- exit_code: 0
- evidence: 1 passed.

## EU-004

- claim: Full API regression remains green.
- source_type: command
- command: `.venv/Scripts/python.exe -m pytest tests/test_redteam_v2_api_router.py -q`
- exit_code: 0
- evidence: 75 passed, 1 warning.

## EU-005

- claim: Accepted gate manifest passes after file-backed log capture.
- source_type: artifact
- path_or_url: `J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-accepted-gates/latest_accepted_gate_manifest.json`
- command: `.venv/Scripts/python.exe "Red Team Studio/고도화/sanity/redteam_ax_accepted_gate_manifest.py"`
- exit_code: 0
- evidence: accepted_gate_count=26, passed_gate_count=26, failed_gate_count=0.

## EU-006

- claim: Completion audit records the new strict source boundary.
- source_type: audit
- path_or_url: `J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/completion-audit/redteam_ax_completion_audit_matrix.json`
- evidence: RTA-COMP-051 status `proved`; status_counts `proved=50`, `partial=1`.
- limits: goal_status remains active_incomplete.
