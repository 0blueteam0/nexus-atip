---
type: work_command_record
task_id: KW-20260702-173105-Red-Team-Studio-RedTeam-AX-live-readiness-remediation-runbook-and-preflight-slice
project: Red Team Studio
task: RedTeam AX live readiness remediation runbook and preflight slice
created: 2026-07-02T17:31:06+09:00
source_package: K:/wiki/work command
---

# TOOLING

## Tool Need
strict live readiness blocker를 코드가 임의로 해소하지 않고, 현재 환경에서 재현 가능한 artifact와 회귀 테스트로 관리해야 했다. 필요한 도구는 Python artifact generator, existing FastAPI model projection, React frontend contract, accepted gate manifest였다.

## Candidates

| candidate | type | benefit | risk | decision |
|---|---|---|---|---|
| Python sanity script | local script | artifact generation and deterministic gate integration | artifact schema drift | selected |
| Docker/WSL control command | system operation | could attempt automatic remediation | high operational risk and external state mutation | rejected |
| OpenVAS/ZAP API health call | scanner integration | live service validation | endpoint/credential missing and HITL required | deferred |
| React UI card update | frontend change | beginner-friendly Korean readiness visibility | copy drift | selected |
| accepted gate manifest | validation orchestration | regression catches missing artifact | longer gate runtime | selected |

## Build vs Adopt
기존 RedTeam AX sanity pattern이 artifact를 생성하고 accepted gate가 이를 검증하는 구조이므로, 새 dependency를 도입하지 않고 같은 패턴을 확장했다.

## Selected Tool
`redteam_ax_live_readiness_remediation_runbook.py`를 새 sanity generator로 선택했다. 이 script는 strict promotion artifact와 environment metadata를 읽고 JSON/Markdown runbook을 생성한다.

## Verification
selected tooling은 py_compile, accepted gate manifest, frontend contract, API router targeted test로 검증했다. 실행 결과 accepted gate는 19/19 통과했다.
