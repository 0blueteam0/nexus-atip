# Feedback

| feedback | evidence_field | source_path | verified_at |
|---|---|---|---|
| RedTeam2 must not treat `status=collected` alone as completion. | `completion_gate_ready`, `missing_required_tool_ids` | `reports.js` | 2026-07-03T13:13:00+09:00 |
| Operators must review the `필수 6개 분석도구` table before approval, Finding, Matrix, Report, or completion-gate actions. | `required_analysis_tool_coverage.rows` | `reports.js` | 2026-07-03T13:13:00+09:00 |
| Future UI work can add visual badges or filters for missing required tools. | `missing_required_tool_ids` | `reports.js` | 2026-07-03T13:13:00+09:00 |
