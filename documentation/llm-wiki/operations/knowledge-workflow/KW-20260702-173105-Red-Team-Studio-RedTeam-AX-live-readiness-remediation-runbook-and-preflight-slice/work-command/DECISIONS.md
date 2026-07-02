---
type: work_command_record
task_id: KW-20260702-173105-Red-Team-Studio-RedTeam-AX-live-readiness-remediation-runbook-and-preflight-slice
project: Red Team Studio
task: RedTeam AX live readiness remediation runbook and preflight slice
created: 2026-07-02T17:31:06+09:00
source_package: K:/wiki/work command
---

# DECISIONS

## Ledger

| id | decision | alternatives | reason | impact |
|---|---|---|---|---|
| D-001 | live readiness remediation을 별도 artifact로 추가 | strict promotion script 안에 메시지만 추가 | blocker 조치 절차를 UI/API/문서/accepted gate에서 독립적으로 추적해야 함 | 운영자는 실제 승격 전 필요한 조치를 순서대로 확인 가능 |
| D-002 | OpenVAS/ZAP 관련 조치는 endpoint/vault reference 존재 확인까지만 수행 | API health check 또는 active scan 자동 실행 | 고위험 실행과 credential 접근은 HITL/ROE 대상이며 현재 환경에는 endpoint가 설정되지 않음 | 승인 없는 고위험 실행 0건 유지 |
| D-003 | runtime readiness overall ready 조건에 remediation 상태를 포함 | remediation을 표시만 하고 readiness 계산에서 제외 | blocker 조치 runbook이 없으면 strict promotion 준비가 끝났다고 말할 수 없음 | unsupported claim을 줄이고 상태 표시를 보수적으로 유지 |
| D-004 | RedTeam2 UI에는 초보자용 한국어 카드로 표시 | 원시 JSON만 표시 | 사용자 요구가 한국어 Red Team Studio 운영 UX이며 blocker 의미를 쉽게 이해해야 함 | 운영자가 다음 조치를 화면에서 바로 파악 가능 |

## Entries
이번 결정들은 실행 자동화보다 증거 기반 운영 준비도를 우선한다. Docker/WSL/OpenVAS/ZAP blocker는 현재 시스템 밖의 상태이므로 코드가 임의로 해결했다고 주장하지 않는다. 대신 조치 runbook artifact를 생성하고, API/UI/LLM Wiki/completion audit이 같은 artifact를 바라보게 하여 추적성을 맞췄다.
