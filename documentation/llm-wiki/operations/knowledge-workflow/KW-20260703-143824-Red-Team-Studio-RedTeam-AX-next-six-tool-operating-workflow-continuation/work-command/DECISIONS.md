---
type: work_command_record
task_id: KW-20260703-143824-Red-Team-Studio-RedTeam-AX-next-six-tool-operating-workflow-continuation
project: Red-Team-Studio
task: RedTeam AX next six-tool operating workflow continuation
created: 2026-07-03T14:38:24+09:00
source_package: K:/wiki/work command
---

# DECISIONS

## D1

Use a guidance-layer API instead of adding more automatic scanner execution. The API composes existing launch readiness and routing policy into a six-tool work order.

## D2

Route OpenVAS and ZAP to read-only service import because they are high-risk external scanner services and require authorization/vault/endpoint controls.

## D3

Record the change as `RTA-COMP-065` but keep the overall `/goal` incomplete because work order guidance is not real operating evidence.

## Ledger

| id | decision | alternatives | reason | impact |
|---|---|---|---|---|

## Entries
