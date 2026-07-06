---
type: decision_log
task_id: KW-20260703-163834-Red-Team-Studio-Continue-RedTeam-AX-goal-simplify-RedTeam2-analyst-UI-and-advance-authorized-mul
project: Red-Team-Studio
task: Continue RedTeam AX goal: simplify RedTeam2 analyst UI and advance authorized multi-tool execution integration
created: 2026-07-03T16:38:34+09:00
---

# Decision Log

| time | decision | alternatives | reason | evidence |
|---|---|---|---|---|
| 2026-07-06T00:00:00+09:00 | Rename and restructure RedTeam2 composite area as result collection/review workflow | Keep `여러 분석도구 순차 실행·결과 첨부`; remove runner UI entirely | User said the old phrase looked like a simple execution listing; runner capability is still needed, but analyst screen should emphasize collected results, candidates, severity distribution, Evidence state, and next review action | reports.js, redteam_v2_models.py, RTA-COMP-074 |
| 2026-07-06T00:00:00+09:00 | Preserve raw traceability in audit/Evidence while hiding it from analyst-first tables | Remove IDs/paths from backend | Evidence Card and Claim-Evidence Matrix require traceability; only display layer should be simplified | analyst_finding_review_summary.raw_paths_hidden_from_analyst=true |
