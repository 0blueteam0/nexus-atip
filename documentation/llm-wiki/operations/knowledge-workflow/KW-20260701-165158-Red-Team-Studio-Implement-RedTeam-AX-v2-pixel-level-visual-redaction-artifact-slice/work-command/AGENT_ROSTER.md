---
type: work_command_record
task_id: KW-20260701-165158-Red-Team-Studio-Implement-RedTeam-AX-v2-pixel-level-visual-redaction-artifact-slice
project: Red-Team-Studio
task: Implement RedTeam AX v2 pixel-level visual redaction artifact slice
created: 2026-07-01T16:51:58+09:00
source_package: K:/wiki/work command
---

# AGENT_ROSTER

## Roles Considered

| role | responsibility | used | reason |
|---|---|---|---|
| Codex implementation agent | inspect, edit, test, document, commit | yes | current execution role |
| Backend reviewer | verify artifact generation and hash handling | partial | API unittest and self-review |
| Frontend reviewer | verify UI syntax/build | partial | `node --check` and Vite build |
| Security reviewer | check untrusted visual data and high-risk execution boundaries | partial | no scanner execution; data-only policy preserved |

## Handoff Rules

- Future agents must not treat estimated OCR bands as final precise OCR redaction.
- Continue with exact-file staging because the repository has many unrelated dirty changes.
- Read `FINAL_PLAN.md`, SPEC visual evidence docs, and this session handoff before next slice.

