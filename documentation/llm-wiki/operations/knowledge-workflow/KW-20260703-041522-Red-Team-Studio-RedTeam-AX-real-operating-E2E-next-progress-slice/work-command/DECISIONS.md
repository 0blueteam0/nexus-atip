---
type: work_command_record
task_id: KW-20260703-041522-Red-Team-Studio-RedTeam-AX-real-operating-E2E-next-progress-slice
project: Red Team Studio
task: RedTeam AX real operating E2E next progress slice
created: 2026-07-03T04:15:22+09:00
source_package: K:/wiki/work command
---

# DECISIONS

## Ledger

| id | decision | alternatives | reason | impact |
|---|---|---|---|---|
| D-001 | Extend SCA normalizer for CycloneDX components and affects. | New endpoint or raw-only SBOM storage. | Existing collection path should produce Evidence candidates for named SCA tool. | Better Evidence/Claim traceability for SBOM imports. |
| D-002 | Mark affects linkage as requiring component-match review. | Treat affects as report-ready proof. | Prevent unsupported vulnerability claims. | Human validation remains explicit. |

## Entries

- Component inventory Evidence and vulnerability candidate Evidence are separate.
- Goal status remains active_incomplete.
