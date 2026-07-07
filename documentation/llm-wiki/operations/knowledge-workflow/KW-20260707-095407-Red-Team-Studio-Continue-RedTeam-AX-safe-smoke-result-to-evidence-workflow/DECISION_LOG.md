---
type: decision_log
task_id: KW-20260707-095407-Red-Team-Studio-Continue-RedTeam-AX-safe-smoke-result-to-evidence-workflow
project: Red-Team-Studio
task: Continue RedTeam AX safe smoke result to evidence workflow
created: 2026-07-07T09:54:07+09:00
---

# Decision Log

| decision | rationale | impact |
|---|---|---|
| Expose safe smoke outputs as candidates only. | Version-only stdout can help operators record installation evidence, but API-executed output must not become attested evidence automatically. | Preserves HITL and evidence integrity. |
| Keep `trusted_as_instruction=false`. | Tool output is untrusted and may not instruct the system. | Prevents prompt/tool-output trust confusion. |
| Keep `runner_unlocks=[]`. | Installation confirmation does not authorize scans or high-risk execution. | Prevents unsafe escalation from version checks. |
| Show only hash/excerpt-derived state in UI. | Analysts need a simple next action without raw path exposure. | Maintains Korean low-skill UX and audit separation. |
