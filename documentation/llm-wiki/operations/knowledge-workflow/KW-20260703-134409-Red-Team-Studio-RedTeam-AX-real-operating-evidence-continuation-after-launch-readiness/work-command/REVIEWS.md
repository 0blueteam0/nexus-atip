# Reviews

Review fields:
- command: targeted regression and sanity checks listed in QUALITY_GATE.md
- exit_code: 0 for syntax, API regression, frontend sanity, Korean copy, completion audit sanity
- artifact_path: runtime/redteam_v2_models.py; runtime/redteam_v2_api_router.py; reports.js
- verified_at: 2026-07-03T14:05:00+09:00

Reviewed controls:
- Summary API does not execute scanners.
- Summary API keeps does_not_mark_goal_complete=true.
- Fixture/test-like source remains blocked.
- Six-tool candidate routes only to human review, not goal completion.