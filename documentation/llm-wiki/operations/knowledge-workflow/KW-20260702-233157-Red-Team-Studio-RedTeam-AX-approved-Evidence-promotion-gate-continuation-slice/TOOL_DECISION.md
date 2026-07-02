---
type: tool_decision
status: complete
project: Red Team Studio
task: RedTeam AX approved Evidence promotion gate continuation slice
created: 2026-07-02T23:31:57+09:00
---

# Tool Decision

## Selected Tools

- `rg` and targeted `Get-Content -Encoding UTF8` for current-state inspection.
- `apply_patch` for scoped source, test, and documentation edits.
- Existing pytest/sanity/accepted-gate scripts for verification.

## Rationale

The requested slice changes repository behavior and persistent documentation; existing local tests and gate scripts provide the strongest available proof without inventing a parallel harness.

## Rejected Alternatives

- Do not auto-approve severity or insert report Claims in the same API because that would collapse required HITL gates.
- Do not create a new Matrix API because existing Matrix draft gate already enforces approved Evidence plus approved Finding severity.

## Reuse Rule

Use `/promote-findings` only after `/approve-evidence`; treat generated Findings as drafts until two distinct severity approvers approve them.
