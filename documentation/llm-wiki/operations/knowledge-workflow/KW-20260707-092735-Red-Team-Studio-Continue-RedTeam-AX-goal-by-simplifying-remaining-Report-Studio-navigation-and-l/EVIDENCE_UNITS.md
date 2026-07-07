---
type: evidence_unit
status: updated
id: EU-REDTEAM2-SCA-IMPORT-ONLY-GUIDANCE-20260707
project: Red-Team-Studio
created: 2026-07-07T09:27:35+09:00
---

# Evidence Unit

## Claim

RedTeam2 안전 설치 확인 후에도 SCA는 실행된 도구 목록에서 사라지지 않고 import-only 결과 첨부 필요 상태로 기본 분석 화면에 표시된다.

## Source

- source_type: local_source_and_tests
- path_or_url: `J:/PortableApps/genai/projects/ai-agentic-soc/soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js`
- command: `node --check .../reports.js`; `python .../redteam_ax_frontend_runtime_readiness_contract.py`; `python .../redteam_ax_frontend_launch_readiness_contract.py`; `.venv/Scripts/python.exe -m pytest ... -k "six_tool_work_order or six_named_tools_imported_outputs_complete_collection_e2e"`
- exit_code: 0 for all final verification commands
- collected_at: 2026-07-07T09:50:00+09:00

## Evidence

- `reports.js` stores `import_only_guidance_rows` and `import_only_guidance_count` in the safe smoke run-status projection.
- RedTeam2 renders `결과 첨부 필요 도구` with default SCA/SBOM guidance even before collection.
- Frontend runtime and launch readiness sanity contracts passed.
- Backend regression for six-tool work order and six imported-output collection E2E passed with repo venv pytest.

## Confidence

High for source contract and regression scope. The change was verified by static JS syntax, frontend contract tests, and selected backend API regressions.

## Limits

This does not prove real SCA operating output was submitted or that final Evidence/Finding/Matrix/Report/export completion gates are closed.

## Related Decisions

Keep SCA as import-only rather than forcing command execution because the current ToolProfile has `adapter_type=import_only` and empty `command_name`.
