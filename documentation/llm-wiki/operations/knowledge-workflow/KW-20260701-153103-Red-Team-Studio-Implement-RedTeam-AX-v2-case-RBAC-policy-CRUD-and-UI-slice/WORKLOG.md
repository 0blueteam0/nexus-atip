---
type: worklog
status: complete
project: Red Team Studio
task: Implement RedTeam AX v2 case RBAC policy CRUD and UI slice
created: 2026-07-01T15:31:03+09:00
updated: 2026-07-01T16:21:00+09:00
---

# Worklog

## 1. 작업 맥락

사용자 목표는 RedTeam AX v2를 케이스 단위 승인, HITL, Evidence/Claim 추적, Korean Report v2 gate 중심 플랫폼으로 고도화하는 것이다. 이번 slice는 이전 slice 13의 case-scoped RBAC foundation 이후, case별 RBAC policy CRUD와 `레드팀 분석2` 관리자 UI를 추가하는 작업이다.

## 2. 회수한 기존 지식

- `Red Team Studio/FINAL_PLAN.md`: slice 13까지 완료 상태와 남은 case policy CRUD 항목 확인.
- `runtime/redteam_v2_models.py`: actor directory, role permission registry, case assignment resolver, approval actor binding 흐름 확인.
- `runtime/redteam_v2_api_router.py`: v2 router prefix와 approval route header binding 확인.
- `soc-frontend-vite-react/.../src/store/methods/reports.js`: `레드팀 분석2` panel과 export workflow 상태 구조 확인.

## 3. 도구 선택

- PowerShell + `rg`: 기존 route/model/UI 위치 탐색.
- `apply_patch`: 소스와 계획 문서의 scoped edit.
- 프로젝트 `.venv/Scripts/python.exe`: FastAPI dependency가 있는 테스트 실행기.
- Playwright: 5177 live UI의 Case RBAC Policy 패널 렌더링 및 button flow 확인.

## 4. 실행 기록

- command: `rg -n "tool|approval|@router\.(post|get|put|delete)" runtime\redteam_v2_api_router.py`
  - exit_code: 0
  - evidence: 실제 ToolAction route가 `/api/redteam/v2/tool-actions/plan`, `/request-approval`, `/approve`임을 확인.
- edit: `runtime/redteam_v2_models.py`
  - artifact_path: `J:/PortableApps/genai/projects/ai-agentic-soc/runtime/redteam_v2_models.py`
  - change: case RBAC policy artifact persistence, assignment validation, CRUD helpers, actor context `case_policy_source` 보정.
- edit: `runtime/redteam_v2_api_router.py`
  - artifact_path: `J:/PortableApps/genai/projects/ai-agentic-soc/runtime/redteam_v2_api_router.py`
  - change: case RBAC PUT/POST/DELETE endpoints 추가.
- edit: `tests/test_redteam_v2_api_router.py`
  - artifact_path: `J:/PortableApps/genai/projects/ai-agentic-soc/tests/test_redteam_v2_api_router.py`
  - change: policy override CRUD와 role mismatch rejection 테스트 추가.
- edit: `soc-frontend-vite-react/.../src/store/methods/reports.js`
  - artifact_path: `J:/PortableApps/genai/projects/ai-agentic-soc/soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js`
  - change: `레드팀 분석2` Case RBAC Policy 패널, Load/Apply Defaults/Add Assignment 연결.
- command: `.venv/Scripts/python.exe -m unittest discover -s tests -p "test_redteam_v2_api_router.py"`
  - exit_code: 0
  - evidence: 24 tests OK.
- command: `.venv/Scripts/python.exe -m unittest discover -s tests -p "test_redteam_v2_sample_e2e.py"`
  - exit_code: 0
  - evidence: 1 test OK.
- command: `.venv/Scripts/python.exe -m unittest discover -s tests -p "test_redteam_api_router.py"`
  - exit_code: 0
  - evidence: 2 tests OK.
- command: `node --check src\store\methods\reports.js`
  - exit_code: 0
- command: `npm.cmd run build`
  - exit_code: 0
  - evidence: Vite build OK; existing chunk-size warning remains.
- command: `Invoke-RestMethod http://127.0.0.1:8765/api/redteam/v2/health`
  - exit_code: 0
  - evidence: `status=ready`, `service=redteam-ax-v2`.
- command: live 8765 RBAC valid policy smoke
  - exit_code: 0
  - evidence: `policy_status=active`, `assignment_count=3`, `approval_status=Approved`, `actor_source=case_policy_artifact`.
- command: Playwright 5177 Report Studio smoke
  - exit_code: 0
  - artifact_path: `J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/live-smoke/redteam2-rbac-crud-export-flow.png`
  - evidence: `redteam2Tab=true`, `rbacPanel=true`, `defaultActor=true`, `policySource=true`.
- command: `.venv/Scripts/python.exe "Red Team Studio/고도화/sanity/test_plan_contract.py"`
  - exit_code: 0
  - evidence: `[+] plan contract sanity passed`.

## 5. 실패와 수정

- `/api/health`는 없는 경로라 404였다. 실제 v2 health는 `/api/redteam/v2/health`로 확인했다.
- 8765에 stale uvicorn 프로세스가 여러 개 있어 포트 점유 프로세스를 정리하고 프로젝트 `.venv`로 재기동했다.
- 전역 `python`과 bundled python에는 FastAPI가 없어 테스트 import가 실패했다. 프로젝트 `.venv/Scripts/python.exe`로 discovery 방식 테스트를 실행했다.
- Playwright 스크립트를 `%TEMP%`에서 실행해 `playwright` 모듈을 못 찾았다. 프로젝트 작업 디렉터리 기준 `NODE_PATH`를 설정해 재실행했다.
- UI body text만으로는 read-only input value인 `case_policy_artifact`가 보이지 않았다. input value를 직접 읽어 확인했다.

## 6. 판단과 통찰

Case RBAC artifact가 역할 판정에는 쓰였지만 actor_context metadata에 고정 `local_case_assignment_registry`가 남으면 감사 증적이 부정확해진다. 따라서 `case_rbac_policy_source()` helper를 추가해 policy 조회와 actor context가 같은 출처 판단을 공유하도록 했다.

## 7. 검증

테스트, build, live API, live UI, plan sanity가 통과했다. Vite chunk-size warning은 기존 bundle size 경고로 이번 slice 기능 실패가 아니다.

## 8. 다음 작업

- 중앙 사용자/그룹 동기화와 외부 SSO/IdP token validation adapter를 붙인다.
- Finding owner/SLA/retest 전용 승인 UI를 추가한다.
- full release/security/starter-pack regression을 별도 slice로 수행한다.
