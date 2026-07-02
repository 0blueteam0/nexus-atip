---
type: work_command_record
task_id: KW-20260702-173105-Red-Team-Studio-RedTeam-AX-live-readiness-remediation-runbook-and-preflight-slice
project: Red Team Studio
task: RedTeam AX live readiness remediation runbook and preflight slice
created: 2026-07-02T17:31:05+09:00
source_package: K:/wiki/work command
---

# TASKS

## Original Request
RedTeam AX의 strict live readiness promotion blocker를 실제 실행 없이 우회하지 말고, 운영자가 Docker/WSL/OpenVAS/ZAP 준비 상태를 재현 가능하게 복구할 수 있는 remediation runbook과 preflight artifact를 추가한다. 기존 승인/증거/가드레일 원칙은 유지하며 UI와 API는 read-only artifact projection만 수행한다.

## Task
1. 기존 strict live readiness promotion artifact를 읽어 남은 blocker를 구조화한다.
2. operator remediation runbook JSON/Markdown artifact를 생성하는 sanity script를 추가한다.
3. `/api/redteam/v2/runtime-readiness`가 remediation artifact를 함께 노출하도록 모델 계층을 확장한다.
4. Report Studio RedTeam2 화면에 조치 runbook 상태와 남은 조치 단계를 한국어로 표시한다.
5. accepted gate manifest와 sanity/test contract를 갱신하여 새 runbook이 회귀 대상에 포함되게 한다.
6. FINAL_PLAN, Detailed_PLAN, LLM Wiki, completion audit matrix에 Slice 70 반영 사항을 기록한다.

## Status
구현과 검증은 완료됐다. runtime readiness remediation artifact는 `ready_for_operator_remediation` 상태이며 blocker는 Docker daemon, WSL distro start, OpenVAS/ZAP endpoint, OpenVAS/ZAP vault reference, scanner report import 순서로 남아 있다. 새 accepted gate manifest는 19개 gate를 모두 통과했다.

## Execution Control
이 slice는 active scanning, exploit execution, endpoint credential 저장, OpenVAS/ZAP API 호출을 수행하지 않는다. 산출물은 기존 readiness artifact와 환경 변수 존재 여부를 읽어 운영자가 수행할 다음 행동을 문서화하는 수준으로 제한했다.

## Tools
PowerShell, Python sanity scripts, pytest, py_compile, node --check, knowledge_workflow close gate를 사용했다. 파일 편집은 apply_patch로 수행했다.

## Verification
검증 명령은 targeted pytest, frontend runtime readiness contract, Korean copy inventory, completion audit matrix, plan contract, Python compile, JavaScript syntax check, accepted gate manifest 19/19 통과로 구성했다. 최종 증거는 `archive/runs/redteam-ax-v2-live-readiness-remediation/`와 `archive/runs/redteam-ax-v2-accepted-gates/`에 남겼다.
