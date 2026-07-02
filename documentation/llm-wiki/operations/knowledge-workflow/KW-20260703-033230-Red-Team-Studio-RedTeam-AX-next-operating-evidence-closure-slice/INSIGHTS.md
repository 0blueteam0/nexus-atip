---
type: insights
status: complete
project: Red Team Studio
created: 2026-07-03T03:32:30+09:00
updated: 2026-07-03T04:24:00+09:00
---

# Insights

- Evidence Card 생성과 승인 전환을 한 API에 넣더라도 기본값은 `pending_review`로 유지해야 한다.
- 차단된 검토 요청은 승인 실패만 아니라 생성 부작용도 없어야 한다.
- accepted gate 24/24는 구현 slice의 회귀 상태를 의미하며, 전체 RedTeam AX 종료 조건 달성을 의미하지 않는다.
