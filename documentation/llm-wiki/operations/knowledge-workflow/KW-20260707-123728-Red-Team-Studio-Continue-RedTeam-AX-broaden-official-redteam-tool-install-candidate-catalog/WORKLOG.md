---
type: worklog
status: draft
project: Red Team Studio
task: Continue RedTeam AX broaden official redteam tool install candidate catalog
created: 2026-07-07T12:37:28+09:00
---

# Worklog

## 1. 작업 맥락

사용자는 RedTeam AX의 최우선 목표를 레드팀 도구 탐색과 설치 관련 진행으로 지정했다. 이전 조각은 Amass, ffuf, Nmap, Gitleaks 4개 후보를 추가했다. 이번 조각은 SPEC 24에 맞춰 scanner 중심을 넘어 레드팀 캠페인 전 과정 도구 후보를 넓힌다.

## 2. 회수한 기존 지식

`SPEC/24_OPEN_SOURCE_TOOL_INTEGRATION_CATALOG.md`가 SpiderFoot, subfinder/httpx, GoWitness, EyeWitness, Nettacker, BloodHound, PingCastle, Certipy, Stratus Red Team, Caldera, Atomic Red Team, OpenBAS, VECTR, Attack Flow, Timesketch, Velociraptor, Sigma, PyRIT/Garak/Inspect/AgentDojo를 요구 후보로 제시하는 것을 확인했다.

## 3. 도구 선택

`rg`로 SPEC과 현재 코드 계약을 확인했고, 웹 검색으로 공식 저장소/문서 출처를 확인했다. 수동 수정은 `apply_patch`로 진행했다. 검증은 Python compile, pytest, Node syntax, frontend sanity, git diff check를 사용했다.

## 4. 실행 기록

artifact_path: `projects/ai-agentic-soc/runtime/redteam_v2_models.py`; added broadened `DISCOVERED_TOOL_INSTALL_CANDIDATES`.

artifact_path: `projects/ai-agentic-soc/tests/test_redteam_v2_api_router.py`; strengthened readiness regression to require 20+ candidates and representative names.

artifact_path: `projects/ai-agentic-soc/Red Team Studio/Detailed_PLAN.MD`; added section 103.

artifact_path: `projects/ai-agentic-soc/Red Team Studio/FINAL_PLAN.md`; added section 156.

## 5. 실패와 수정

Initial broad `rg` over the whole project produced excessive vendor/HTML output. Scope was narrowed to SPEC, runtime, frontend methods, and tests.

## 6. 판단과 통찰

All new tools remain install/onboarding candidates only. This moves priority 1 forward without creating unauthorized execution paths. High-risk tools such as Caldera, Atomic Red Team, OpenBAS, Stratus, Velociraptor, and Certipy should start with catalog/import adapters before execution adapters.

## 7. 검증

command: `.venv python -m py_compile runtime/redteam_v2_models.py runtime/redteam_v2_api_router.py`; exit_code: 0.
command: `.venv python -m pytest tests/test_redteam_v2_api_router.py -k tool_install_readiness_exposes_operator_run_install_plans`; exit_code: 0.
command: `node --check reports.js`; exit_code: 0.
command: `python redteam_ax_frontend_runtime_readiness_contract.py`; exit_code: 0.
command: `python redteam_ax_frontend_launch_readiness_contract.py`; exit_code: 0.
command: `git diff --check`; exit_code: 0.

## 8. 다음 작업

Promote one bounded candidate next, preferably `subfinder`, `sigma-cli`, or `gitleaks`. Promotion requires actual install verification, wrapper hash pin, ToolProfile, normalizer, Evidence Card mapping, Claim-Evidence Matrix mapping, frontend run button, and regression tests.
