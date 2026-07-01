---
type: decision_log
task_id: KW-20260701-154433-Red-Team-Studio-Implement-RedTeam-AX-v2-governed-analysis-tool-runner-and-agent-registry-slice
project: Red Team Studio
task: Implement RedTeam AX v2 governed analysis tool runner and agent registry slice
created: 2026-07-01T15:44:33+09:00
updated: 2026-07-01T16:03:00+09:00
---

# Decision Log

| time | decision | alternatives | reason | evidence |
|---|---|---|---|---|
| 2026-07-01T15:50:00+09:00 | DEC-TOOLHUB-FOUNDATION-FIRST: implement ToolProfile/agent registry before real scanner invocation | Directly call scanner CLIs | SPEC requires ToolProfile, policy, HITL, ToolRunRecord, Evidence conversion; direct active scanning would violate safe-by-default | `SPEC/24`, `SPEC/26`, `SPEC/31`; tests OK |
| 2026-07-01T15:55:00+09:00 | DEC-ACTIVE-SCANNER-APPROVAL-GATE: Nuclei/OpenVAS/ZAP default to T3 and require approval for active/manual/lab run records | Treat all tools as T0 import | Active scanner risk differs from offline SCA and must keep ROE/HITL invariant | `test_v2_governed_active_scanner_requires_approval_then_agent_normalizes_to_evidence` |
| 2026-07-01T15:58:00+09:00 | Tool output envelope includes `trusted_as_instruction=false` | Pass raw output directly to agent | Agentic RAG security spec requires untrusted context isolation | live smoke normalized result |
