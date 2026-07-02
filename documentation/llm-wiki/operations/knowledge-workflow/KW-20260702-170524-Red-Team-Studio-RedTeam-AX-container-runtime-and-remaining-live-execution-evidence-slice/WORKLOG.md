---
type: worklog
status: updated
project: Red Team Studio
task: RedTeam AX container runtime and remaining live execution evidence slice
created: 2026-07-02T17:05:24+09:00
---

# Worklog

## 1. 작업 맥락

이 작업은 RedTeam AX의 남은 실측 조건 중 Docker/container runtime, WSL runtime, 조직 OpenVAS/ZAP endpoint readiness를 명확히 증거화하기 위한 후속 slice다. 직전 slice는 external scanner service import live harness를 추가했고, 이번 slice는 Docker가 막힌 로컬 환경에서 WSL 대체/보조 runtime readiness를 같은 방식으로 추적한다.

## 2. 회수한 기존 지식

- `latest_runtime_readiness_status()`는 Docker, external scanner readiness, service import live artifact를 read-only로 합쳐 반환하고 있었다.
- RedTeam2의 `실행 환경 준비도 / 남은 실측 조건` 패널은 Docker/OpenVAS/ZAP blocker를 한국어로 표시하고 있었다.
- accepted gate manifest는 16개 gate를 실행하고 있었다.

## 3. 도구 선택

PowerShell, Python sanity scripts, pytest, node syntax check, project accepted gate manifest를 사용했다. 외부 scanner나 Docker 컨테이너 실행은 수행하지 않았다.

## 4. 실행 기록

| command | exit_code | artifact_path | note |
|---|---:|---|---|
| `docker version --format "{{json .}}"` | 1 | n/a | Docker Desktop daemon unable to start |
| `podman version --format json` | 1 | n/a | podman executable unavailable |
| `wsl.exe -l -v` | 0 | n/a | stopped WSL2 distros listed |
| `wsl.exe -d Ubuntu-22.04 -- uname -a` | 1 | n/a | WSL VHDX mount/start failure observed |
| `.venv/Scripts/python.exe "Red Team Studio/고도화/sanity/redteam_ax_wsl_runtime_readiness.py" --allow-start` | 0 | `archive/runs/redteam-ax-v2-wsl-runtime-readiness/latest_wsl_runtime_readiness.json` | wrote `blocked_wsl_distribution_start_failed` |
| `.venv/Scripts/python.exe -m pytest tests/test_redteam_v2_api_router.py::RedTeamV2ApiRouterTests::test_runtime_readiness_status_is_read_only_artifact_projection -q` | 0 | n/a | API projection test passed |
| `.venv/Scripts/python.exe "Red Team Studio/고도화/sanity/redteam_ax_frontend_runtime_readiness_contract.py"` | 0 | n/a | frontend runtime readiness contract passed after label fix |
| `.venv/Scripts/python.exe "Red Team Studio/고도화/sanity/test_redteam2_korean_copy_inventory.py"` | 0 | `Red Team Studio/고도화/completion-audit/redteam2_korean_copy_inventory.json` | Korean copy inventory passed |
| `.venv/Scripts/python.exe "Red Team Studio/고도화/sanity/test_completion_audit_matrix.py"` | 0 | n/a | completion audit sanity passed |
| `.venv/Scripts/python.exe "Red Team Studio/고도화/sanity/test_plan_contract.py"` | 0 | n/a | plan contract sanity passed |
| `node --check soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js` | 0 | n/a | frontend syntax passed |
| `.venv/Scripts/python.exe "Red Team Studio/고도화/sanity/redteam_ax_accepted_gate_manifest.py"` | 0 | `archive/runs/redteam-ax-v2-accepted-gates/latest_accepted_gate_manifest.json` | 17 accepted gates, 17 passed, 0 failed |

## 5. 실패와 수정

The first frontend runtime readiness contract run failed because the panel segment did not contain the exact `WSL 실행 환경` anchor. The RedTeam2 card label was changed from `WSL` to `WSL 실행 환경`, then the contract passed.

## 6. 판단과 통찰

WSL readiness is useful as runtime blocker evidence, but it is not a substitute for successful Docker/container live smoke. The correct status is still partial: Docker daemon, WSL distro start, and organization OpenVAS/ZAP live endpoint readiness remain unresolved.

## 7. 검증

Accepted gate manifest passed 17/17. The WSL readiness artifact records `blocked_wsl_distribution_start_failed` with no active scan and no command trust.

## 8. 다음 작업

Repair Docker Desktop daemon and WSL distro mount/start, then run `redteam_ax_container_runtime_smoke.py --allow-real --require-real` and `redteam_ax_wsl_runtime_readiness.py --allow-start --require-ready`. After organization OpenVAS/ZAP endpoints and vault refs are configured, run the external scanner readiness/import live gates with `--allow-network --require-ready`.
