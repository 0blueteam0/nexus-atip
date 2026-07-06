---
type: work_command_record
task_id: KW-20260703-163834-Red-Team-Studio-Continue-RedTeam-AX-goal-simplify-RedTeam2-analyst-UI-and-advance-authorized-mul
project: Red-Team-Studio
task: Continue RedTeam AX goal: simplify RedTeam2 analyst UI and advance authorized multi-tool execution integration
created: 2026-07-03T16:38:34+09:00
source_package: K:/wiki/work command
---

# DECISIONS

## Ledger

| id | decision | alternatives | reason | impact |
|---|---|---|---|---|
| D-001 | RedTeam2 복합 도구 영역을 `분석 결과 수집·검토 워크플로우`로 명명한다. | 기존 `여러 분석도구 순차 실행·결과 첨부` 유지 | 기존 표현은 사용자가 지적한 것처럼 단순 실행 목록으로 보이며 분석 업무 절차를 설명하지 못했다. | 분석가는 도구 실행 자체보다 결과 후보, severity, Evidence 상태, 다음 검토 행동을 먼저 본다. |
| D-002 | raw path/run id는 분석가 기본 표시에 노출하지 않고 관리자/감사 상세로 낮춘다. | 모든 path/id를 표에 직접 표시 | 분석 페이지에 경로와 내부 ID가 많으면 한국어 사용자가 업무 판단보다 시스템 내부 구현을 보게 된다. | 화면 복잡도 감소, Evidence 추적성은 유지. |
| D-003 | backend summary contract를 추가해 프론트 복사문에만 의존하지 않는다. | 프론트에서 기존 toolchain 응답을 임의로 재가공 | Claim/Evidence 검토 후보는 서버 응답에서 구조화해야 테스트와 보고서 생성으로 재사용 가능하다. | LLM wiki, sanity, frontend가 같은 summary key를 공유한다. |

## Entries
2026-07-06: `analyst_finding_review_summary`를 추가하고 `raw_paths_hidden_from_analyst=true`를 계약화했다. 사용자 지적에 따라 예전 실행 나열형 문구는 테스트에서 disallowed phrase로 관리한다.
