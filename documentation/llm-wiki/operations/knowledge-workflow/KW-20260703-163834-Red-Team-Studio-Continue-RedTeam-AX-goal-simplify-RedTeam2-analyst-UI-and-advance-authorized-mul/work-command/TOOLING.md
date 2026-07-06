---
type: work_command_record
task_id: KW-20260703-163834-Red-Team-Studio-Continue-RedTeam-AX-goal-simplify-RedTeam2-analyst-UI-and-advance-authorized-mul
project: Red-Team-Studio
task: Continue RedTeam AX goal: simplify RedTeam2 analyst UI and advance authorized multi-tool execution integration
created: 2026-07-03T16:38:34+09:00
source_package: K:/wiki/work command
---

# TOOLING

## Tool Need
소스 앵커 확인, 구조화 수정, 문법 검증, sanity 검증, 한국어 copy inventory 갱신, git 반영이 필요했다.

## Candidates

| candidate | type | benefit | risk | decision |
|---|---|---|---|---|
| `rg` | search | 빠른 문구/앵커 확인 | 인코딩 출력이 PowerShell에서 깨질 수 있음 | 사용 |
| `apply_patch` | edit | 의도한 diff만 만들 수 있음 | 큰 파일 다중 위치 수정 시 누락 가능 | 사용 |
| `node --check` | validation | frontend JS 문법 회귀 확인 | 런타임 UI까지 보장하지 않음 | 사용 |
| Python sanity scripts | validation | backend/frontend/audit 계약 확인 | 계약이 오래되면 과검증 가능 | 사용 후 최신 화면 기준으로 조정 |
| Playwright | browser validation | 실제 화면 확인 가능 | 이번 증분에서는 서버 상태 확인 비용 큼 | 후속 권장 |

## Build vs Adopt
신규 테스트 프레임워크를 만들지 않고 기존 sanity script 구조를 채택했다. 단일 신규 contract script만 추가해 backend analyst summary의 핵심 키와 사용자 보호 문구를 검증했다.

## Selected Tool
기존 Node/Python validation과 repository-local sanity scripts.

## Verification
모든 선택 도구는 exit code 0 검증으로 완료됐다. 실패했던 runtime readiness contract는 사용자 목표에 맞지 않는 오래된 execution/API/path 앵커를 제거한 뒤 통과했다.
