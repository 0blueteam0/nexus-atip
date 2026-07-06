---
type: work_command_record
task_id: KW-20260706-125806-Red-Team-Studio-Continue-RedTeam-AX-goal-reduce-remaining-RedTeam2-analyst-facing-English-and-in
project: Red-Team-Studio
task: Continue RedTeam AX goal: reduce remaining RedTeam2 analyst-facing English and internal tokens
created: 2026-07-06T12:58:06+09:00
source_package: K:/wiki/work command
---

# TOOLING

## Tools Used

- `apply_patch`: scoped edits to frontend, sanity checks, audit docs, and session records.
- Vite dev server: local frontend runtime at `http://127.0.0.1:5177/`.
- Playwright/Node browser inspection: captured default DOM text and screenshots before/after copy reduction.
- `node --check`: verified JavaScript syntax for `reports.js`.
- Python sanity contracts: verified Korean copy inventory, runtime readiness, launch readiness, completion audit matrix, and toolchain analyst summary.
- Git: stage, commit, and push after evidence close.

## Tooling Constraints

- No destructive Git operations.
- Unrelated dirty worktree files remain untouched.
- Backend execution contracts were not renamed.
