---
type: decision_log
task_id: KW-20260707-090951-Red-Team-Studio-Continue-RedTeam-AX-goal-by-localizing-shared-Report-Studio-and-RedTeam2-remaini
project: Red-Team-Studio
task: Continue RedTeam AX goal by localizing shared Report Studio and RedTeam2 remaining analyst-facing English labels
created: 2026-07-07T09:09:51+09:00
---

# Decision Log

| time | decision | alternatives | reason | evidence |
|---|---|---|---|---|
| 2026-07-07T09:18:00+09:00 | 기본 분석가 화면에서 `RBAC`를 `권한 정책`으로 낮춘다. | RBAC 약어를 유지한다. | 초급 분석가 사용자 화면 목표와 맞지 않고 브라우저 DOM에서 약어 노출을 줄이는 것이 이번 slice 목적이다. | `reports.js`, `test_redteam2_korean_copy_inventory.py` |
| 2026-07-07T09:20:00+09:00 | Report Studio 공통 헤더/탭을 한국어-first로 변경한다. | RedTeam2 본문만 수정한다. | 공통 헤더가 기본 화면의 첫 인지 지점이라 본문 한국어화 효과를 약화시킨다. | Playwright DOM evidence JSON |
| 2026-07-07T09:22:00+09:00 | backend payload/audit 용어는 유지하고 UI 표시만 변경한다. | 데이터 key까지 rename한다. | Evidence traceability와 기존 API/test 호환성을 보존해야 한다. | sanity tests all passed |
