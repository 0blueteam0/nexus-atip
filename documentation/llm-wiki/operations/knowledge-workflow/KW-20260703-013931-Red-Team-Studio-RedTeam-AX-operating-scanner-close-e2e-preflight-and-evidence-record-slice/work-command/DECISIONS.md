# Decisions

## Compose, Do Not Duplicate

The operating submit-and-close API composes existing primitives instead of duplicating gate logic. This preserves the established Evidence Card, Finding, Claim-Evidence Matrix, Report v2, export, and completion gate semantics.

## No Scanner Execution

The new endpoint reads existing workspace files only. It records `commands_executed_by_api=false`, `active_scan_executed=false`, `shell_expansion_allowed=false`, and `trusted_as_instruction=false`.

## Audit Honesty

RTA-COMP-033 is marked proved only for controlled fixture coverage. The full goal remains active until real organization artifacts and real approvers are verified.
