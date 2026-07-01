---
type: work_command_record
task_id: KW-20260701-154433-Red-Team-Studio-Implement-RedTeam-AX-v2-governed-analysis-tool-runner-and-agent-registry-slice
project: Red Team Studio
task: Implement RedTeam AX v2 governed analysis tool runner and agent registry slice
created: 2026-07-01T15:44:33+09:00
updated: 2026-07-01T16:05:00+09:00
source_package: K:/wiki/work command
---

# DECISIONS

## Ledger

| id | decision | alternatives | reason | impact |
|---|---|---|---|---|
| DEC-001 | Implement registry/gate before real scanner execution | Run local scanners directly | Specs require ToolProfile, approval, evidence contract first | Safe-by-default integration |
| DEC-002 | Nuclei/OpenVAS/ZAP are T3 active scanners | Treat all tools as T0 | Active scanner risk requires HITL | Approval gate tests |
| DEC-003 | Trivy/SCA/npm audit are T0 offline/SCA tools by default | Require HITL for all tools | Offline dependency parsing can be automated within workspace policy | Faster SCA evidence intake |
| DEC-004 | Tool output gets untrusted envelope | Feed raw output to LLM directly | Agentic RAG security requires untrusted context isolation | Prompt injection control |

## Entries

The implementation deliberately records/imports scanner output instead of running active network scans until sandbox and allowlist enforcement are implemented.
