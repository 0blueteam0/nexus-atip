---
type: insights
status: complete
project: Red-Team-Studio
task: RedTeam AX continue real operating tool workflow after six-tool work order
created: 2026-07-03T14:50:10+09:00
---

# Insights

- RedTeam2의 주요 사용자는 "지금 어떤 버튼을 눌러야 하는가"를 먼저 알아야 한다. 세부 환경 설정 상태는 같은 화면에 있더라도 관리자용으로 분리해야 한다.
- 6개 도구의 실제 실행은 HITL/ROE를 통과한 사람이 수행해야 하므로, 웹앱은 실행보다 제출 양식, 증거 검증, Evidence Card 연결을 자동화하는 것이 맞다.
- `six-tool-submission-template`는 직접 실행 없이 collection_package와 attachment_template만 생성하므로 unsupported claim이나 승인 없는 실행 위험을 늘리지 않는다.
- goal-completion-review가 blocked인 상태를 유지하는 것이 올바르다. 이번 변경은 실측 증거 제출을 쉽게 만드는 개편이지 최종 완료 증거가 아니다.
