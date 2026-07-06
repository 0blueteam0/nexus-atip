---
type: insights
status: ready_for_close
project: Red-Team-Studio
created: 2026-07-06T12:24:34+09:00
updated: 2026-07-06T12:47:03+09:00
---

# Insights

- RedTeam2의 문제는 기능 부족보다 역할별 정보 노출 계층이 섞인 데 있었다. 같은 기능을 유지하면서도 기본 DOM에서 관리자 세부정보를 제거하면 분석가 흐름이 훨씬 명확해진다.
- 앞으로 UI 회귀는 소스 문자열 검사가 아니라 실제 기본 DOM 스냅샷을 함께 봐야 한다. 관리자 토글 때문에 소스에는 금지어가 남는 것이 정상이다.
- 아직 남은 UX debt는 영어/internal token이다. `ToolActionCard`, `TAC-*`, 일부 agent/action id는 다음 slice에서 한국어 설명과 감사용 세부정보로 분리해야 한다.
