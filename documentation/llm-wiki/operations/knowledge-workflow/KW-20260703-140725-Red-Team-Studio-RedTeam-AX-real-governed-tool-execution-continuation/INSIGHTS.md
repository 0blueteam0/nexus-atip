---
type: insights
task_id: KW-20260703-140725-Red-Team-Studio-RedTeam-AX-real-governed-tool-execution-continuation
project: Red-Team-Studio
task: RedTeam AX real governed tool execution continuation
created: 2026-07-03T14:07:25+09:00
updated: 2026-07-03T14:32:00+09:00
---

# Insights

- Global runtime readiness is appropriate for real scans, but too coarse for version-only installation smoke checks.
- The partial path must be opt-in and narrow because it actually runs a local process.
- Keeping arbitrary scan commands blocked while allowing `--version` moves the frontend button closer to real installed-tool execution without weakening ROE/HITL boundaries.
