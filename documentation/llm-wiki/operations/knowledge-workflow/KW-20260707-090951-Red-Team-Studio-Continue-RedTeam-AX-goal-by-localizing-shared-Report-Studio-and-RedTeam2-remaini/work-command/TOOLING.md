---
type: work_command_record
task_id: KW-20260707-090951-Red-Team-Studio-Continue-RedTeam-AX-goal-by-localizing-shared-Report-Studio-and-RedTeam2-remaini
project: Red-Team-Studio
task: Continue RedTeam AX goal by localizing shared Report Studio and RedTeam2 remaining analyst-facing English labels
created: 2026-07-07T09:09:51+09:00
source_package: K:/wiki/work command
---

# TOOLING

## Tool Need

Need source search/editing, frontend syntax validation, sanity contracts, and browser DOM evidence for UI copy localization.

## Candidates

| candidate | type | benefit | risk | decision |
|---|---|---|---|---|
| `rg` | search | Fast targeted source and test anchor discovery. | Broad search can hit huge archived artifacts. | selected with narrowed paths. |
| `apply_patch` | edit | Controlled narrow file edits. | Patch context must match exactly. | selected. |
| `node --check` | validation | Fast JS syntax check. | Does not prove runtime rendering. | selected. |
| Python sanity scripts | validation | Existing project contracts for copy/readiness/audit. | Can require expected anchor updates. | selected. |
| Vite + Playwright | browser evidence | Proves real default DOM text. | Needs dev server lifecycle and encoding-safe script. | selected. |

## Build vs Adopt

Adopted existing Vite and sanity scripts. Added a small evidence-only Playwright capture script inside the knowledge workflow browser folder.

## Selected Tool

Primary verification path: `node --check`, Python sanity scripts, `npm run dev -- --host 127.0.0.1 --port 5177`, Playwright capture script.

## Verification

All selected checks exited 0 after the RBAC inventory adjustment and UTF-8 capture script fix.
