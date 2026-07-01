---
type: decision_log
task_id: KW-20260701-160449-Red-Team-Studio-Implement-RedTeam-AX-v2-tool-specific-output-normalizers-slice
project: Red Team Studio
task: Implement RedTeam AX v2 tool-specific output normalizers slice
created: 2026-07-01T16:04:49+09:00
updated: 2026-07-01T16:18:00+09:00
---

# Decision Log

| time | decision | alternatives | reason | evidence |
|---|---|---|---|---|
| 2026-07-01T16:08:00+09:00 | DEC-PARSER-CANDIDATE-ONLY: parsed items remain evidence candidates | Promote parser findings directly to Findings | SPEC forbids tool-output-only verified claims | parser tests, normalized prohibited claims |
| 2026-07-01T16:10:00+09:00 | DEC-RAW-OUTPUT-UNTRUSTED: every parsed item sets `trusted_as_instruction=false` | Trust scanner fields as direct instructions | Agentic RAG security requires untrusted context isolation | parser tests assert false |
| 2026-07-01T16:12:00+09:00 | Use inline helper parsers now, split schemas later | Build separate parser package now | Keeps slice integrated with current artifact model; schema split remains planned | `FINAL_PLAN.md` Slice 16 |
