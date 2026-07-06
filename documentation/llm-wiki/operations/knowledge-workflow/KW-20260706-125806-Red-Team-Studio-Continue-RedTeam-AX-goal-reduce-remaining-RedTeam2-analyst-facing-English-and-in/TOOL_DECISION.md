# Tool Decision

- `rg` and targeted file inspection were used for locating relevant RedTeam2 copy and sanity anchors.
- `apply_patch` was used for scoped edits to JavaScript, sanity tests, and documentation.
- Vite dev server on `http://127.0.0.1:5177/` plus Playwright was used for DOM-level browser evidence because the issue is user-visible page copy.
- Static syntax and Python sanity contracts were used as lightweight regression coverage for the edited areas.
- No destructive filesystem or Git reset operations were used. Unrelated dirty worktree files were left untouched.
