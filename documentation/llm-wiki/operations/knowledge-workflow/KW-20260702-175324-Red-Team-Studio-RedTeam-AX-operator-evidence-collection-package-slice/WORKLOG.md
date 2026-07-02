---
type: worklog
status: complete
project: Red Team Studio
task: RedTeam AX operator evidence collection package slice
created: 2026-07-02T17:53:24+09:00
updated: 2026-07-02T21:22:00+09:00
---

# Worklog

## 1. 작업 맥락

이전 slice는 RedTeam2 runtime readiness panel에 live readiness remediation runbook step visibility를 추가했다. 이번 slice는 그 runbook을 Evidence Card 후보 첨부 목록으로 변환해 운영자가 남은 실측 증거를 모을 수 있게 한다.

## 2. 회수한 기존 지식

- `latest_live_readiness_remediation_runbook.json`: 5개 blocked step 확인.
- `runtime/redteam_v2_models.py`: `latest_runtime_readiness_status()` artifact projection 구조 확인.
- `reports.js`: `실행 환경 준비도 / 남은 실측 조건` panel과 Korean status label 구조 확인.
- Completion audit RTA-COMP-015: Docker/WSL/OpenVAS/ZAP live readiness가 partial임을 확인.

## 3. 도구 선택

- `rg`, `Get-Content -Encoding UTF8`: 기존 코드와 문서 위치 확인.
- `apply_patch`: 파일 수정.
- `.venv\Scripts\python.exe`: sanity script, pytest, accepted gate 실행.
- `node --check`: frontend syntax check.

## 4. 실행 기록

| command | exit_code | artifact_path |
|---|---:|---|
| `.\\.venv\\Scripts\\python.exe "Red Team Studio\\고도화\\sanity\\redteam_ax_operator_evidence_collection_package.py"` | 0 | `archive/runs/redteam-ax-v2-operator-evidence-collection/latest_operator_evidence_collection_package.json` |
| `.\\.venv\\Scripts\\python.exe -m py_compile runtime/redteam_v2_models.py "Red Team Studio\\고도화\\sanity\\redteam_ax_operator_evidence_collection_package.py" "Red Team Studio\\고도화\\sanity\\redteam_ax_accepted_gate_manifest.py"` | 0 | compile check |
| `node --check "soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js"` | 0 | syntax check |
| `.\\.venv\\Scripts\\python.exe -m pytest tests/test_redteam_v2_api_router.py::RedTeamV2ApiRouterTests::test_runtime_readiness_status_is_read_only_artifact_projection -q` | 0 | pytest output |
| `.\\.venv\\Scripts\\python.exe "Red Team Studio\\고도화\\sanity\\redteam_ax_frontend_runtime_readiness_contract.py"` | 0 | contract output |
| `.\\.venv\\Scripts\\python.exe "Red Team Studio\\고도화\\sanity\\test_redteam2_korean_copy_inventory.py"` | 0 | `redteam2_korean_copy_inventory.json` |
| `.\\.venv\\Scripts\\python.exe "Red Team Studio\\고도화\\sanity\\test_completion_audit_matrix.py"` | 0 | completion audit sanity |
| `.\\.venv\\Scripts\\python.exe "Red Team Studio\\고도화\\sanity\\test_plan_contract.py"` | 0 | plan contract sanity |
| `.\\.venv\\Scripts\\python.exe "Red Team Studio\\고도화\\sanity\\redteam_ax_accepted_gate_manifest.py"` | 0 | `latest_accepted_gate_manifest.json` with 20/20 |

## 5. 실패와 수정

- Completion audit JSON patch를 한 번에 적용하려다 주변 문맥 불일치로 실패했다. 좁은 hunk로 나누어 RTA-COMP-012와 RTA-COMP-015만 갱신했다.
- Operator evidence package의 expected status 파싱이 처음에는 `ready/passed` 단순 분기였으므로 `status=promotion_ready`를 정확히 파싱하도록 보강했다.

## 6. 판단과 통찰

이 slice는 live blocker를 해결하지 않는다. 대신 blocker별로 어떤 artifact를 Evidence Card 후보로 붙여야 하는지 명확히 하여 다음 운영자 실측 작업의 ambiguity를 줄인다.

## 7. 검증

Focused sanity와 accepted gate 20/20이 통과했다. accepted gate snapshot은 여전히 `goal_status=active_incomplete`이며 RTA-COMP-015는 partial이다.

## 8. 다음 작업

Docker Desktop daemon, WSL distro start, OpenVAS/ZAP read-only endpoint/vault ref를 준비한 뒤 operator evidence package의 항목을 채우고 `--require-inputs-ready`, `--require-clear`, strict promotion을 순서대로 실행한다.
