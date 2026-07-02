---
type: worklog
status: draft
project: Red Team Studio
task: RedTeam AX real operating E2E next progress slice
created: 2026-07-03T04:15:22+09:00
---

# Worklog

## 1. 작업 맥락

Active RedTeam AX goal requires real use of Nuclei/OpenVAS/Trivy/SCA/npm audit/ZAP, Korean beginner UI, Evidence Card/Claim-Evidence Matrix traceability, and zero unsupported claims. Completion audit showed one partial item remains around real operating runtime/service evidence. This slice strengthens SCA/SBOM evidence normalization, a named required tool path.

## 2. 회수한 기존 지식

- Completion audit matrix: 42 proved, 1 partial before this slice.
- `runtime/redteam_v2_models.py`: SCA profile and `_normalize_sca_output`.
- `tests/test_redteam_v2_api_router.py`: governed toolchain import/collection E2E.
- RedTeam2 UI SCA tool guide in `reports.js`.

## 3. 도구 선택

- Used existing pytest/API/sanity gates because the work extends existing toolchain collection contracts.
- Did not add a new endpoint; SCA/SBOM belongs in the existing normalizer and collect-results lane.

## 4. 실행 기록

- command: `rg -n "TOOL-.*SCA|SCA|pip-audit|semgrep|dependency|nuclei|trivy|npm audit|ZAP|OpenVAS" ...`; exit_code: 0; purpose: verify SCA profile/normalizer state.
- edit: `runtime/redteam_v2_models.py`; added CycloneDX component inventory and affects linkage normalization.
- edit: `tests/test_redteam_v2_api_router.py`; added SCA CycloneDX + npm audit composite import/collection regression.
- edit: `reports.js`; updated Korean SCA guidance for CycloneDX SBOM, component inventory Evidence, vulnerability candidate Evidence, affects review limits.
- edit: sanity anchors, `Detailed_PLAN.MD`, `FINAL_PLAN.md`, `LLM_WIKI_HOME.md`, completion audit matrix.
- command: `.venv/Scripts/python.exe -m pytest tests/test_redteam_v2_api_router.py::RedTeamV2ApiRouterTests::test_v2_toolchain_collect_results_normalizes_sca_cyclonedx_components_and_affects -q`; exit_code: 0.
- command: `.venv/Scripts/python.exe -m pytest tests/test_redteam_v2_api_router.py -q`; exit_code: 0; result: 72 passed, 1 warning.
- command: `.venv/Scripts/python.exe -m py_compile runtime/redteam_v2_models.py runtime/redteam_v2_api_router.py`; exit_code: 0.
- command: `node --check soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js`; exit_code: 0.
- command: RedTeam2 runtime readiness contract; exit_code: 0.
- command: Korean copy inventory; exit_code: 0.
- command: completion audit matrix sanity; exit_code: 0.
- command: plan contract sanity; exit_code: 0.
- command: accepted gate manifest; exit_code: 0; artifact_path: `projects/ai-agentic-soc/archive/runs/redteam-ax-v2-accepted-gates/latest_accepted_gate_manifest.json`.

## 5. 실패와 수정

- Initial SCA regression used only one tool and failed because governed toolchain composite execution requires at least two tools. Fixed by importing SCA CycloneDX plus npm audit in the same toolchain.

## 6. 판단과 통찰

- SCA was registered, but component inventory and vulnerability affects linkage were too weak for Evidence/Claim traceability.
- Component presence and vulnerability applicability should stay separate Evidence candidates until a human validates the match.

## 7. 검증

- Focused SCA regression: passed.
- Full API regression: 72 passed, 1 warning.
- Python compile, frontend JS check, runtime readiness contract, Korean copy inventory, completion audit, plan contract, accepted gate 24/24: passed.

## 8. 다음 작업

Use a real approved CycloneDX/SCA artifact and real approvers, then close Evidence approval, Finding promotion, 2-person severity, Matrix, Report v2 export, and completion gate.
