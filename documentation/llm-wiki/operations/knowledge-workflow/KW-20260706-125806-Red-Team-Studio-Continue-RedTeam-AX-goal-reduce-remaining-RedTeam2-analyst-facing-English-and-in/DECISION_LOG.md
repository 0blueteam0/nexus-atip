# Decision Log

## D-001 Display Translation Layer Instead of Backend Contract Mutation

- decision: Reduce analyst-facing internal tokens through display helpers in `reports.js`.
- rationale: The default RedTeam2 page should be readable for Korean analysts, while backend IDs, API paths, and audit terms must remain stable for execution, evidence, and admin/debug flows.
- alternatives_considered: Renaming backend IDs or API routes was rejected because it would increase blast radius and risk breaking existing toolchain/action contracts.
- status: accepted

## D-002 Keep Debug Detail Available Behind Existing Admin Detail Flag

- decision: Some helper functions append raw identifiers only when `showAdminDetails` is enabled.
- rationale: Analysts should not see implementation details by default, but operators still need exact paths and IDs during debugging or platform administration.
- status: accepted

## D-003 Treat This as Incremental Completion Evidence

- decision: Add a completion audit proof item rather than claiming overall RedTeam AX completion.
- rationale: The final user objective requires full tests, security gates, report verification, sample case E2E, and regression verification. This session proves one bounded UI/readiness improvement only.
- status: accepted
