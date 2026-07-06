---
type: ontology_edges
status: draft
project: Red-Team-Studio
created: 2026-07-03T16:38:34+09:00
---

# Ontology Edges

| subject | predicate | object | evidence_id | note |
|---|---|---|---|---|
| RedTeam2 composite area | reframed_as | 분석 결과 수집·검토 워크플로우 | RTA-COMP-074 | 실행 나열형 표현 제거 |
| collect-results API | returns | analyst_finding_review_summary | RTA-COMP-074 | 확인 후보/심각도/Evidence 상태 projection |
| analyst_finding_review_summary | hides | raw local paths from analyst | RTA-COMP-074 | traceability remains in audit/Evidence |
| execution detail tables | demoted_to | 관리자/감사용 상세 기록 | RTA-COMP-074 | 분석가 화면 우선순위 조정 |
