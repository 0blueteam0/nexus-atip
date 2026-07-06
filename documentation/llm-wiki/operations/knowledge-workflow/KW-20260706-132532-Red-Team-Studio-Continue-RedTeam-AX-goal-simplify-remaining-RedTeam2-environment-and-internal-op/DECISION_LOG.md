# Decision Log

## D-001 Keep Backend Contracts, Change Default Display

- decision: Keep API paths, method names, state keys, and audit IDs unchanged, but reduce default visible wording in table cells and labels.
- rationale: Traceability and existing tests rely on backend identifiers. The user-facing problem is default analyst DOM exposure, not persistence format.
- status: accepted

## D-002 Move Operator Evidence Bundle Draft Out of Default Analyst Actions

- decision: The operator evidence submission bundle draft button stays in the admin/workflow area, not the default analyst action row.
- rationale: It is an operational evidence packaging action and reads like a setup/control step to non-expert analysts.
- status: accepted

## D-003 Treat Global Navigation Separately

- decision: Leave global navigation `실행 런타임` out of this RedTeam2 panel slice.
- rationale: Browser inventory reports it as the only remaining flagged line, but it is outside RedTeam2 panel content and should be handled in a common app navigation cleanup slice.
- status: accepted
