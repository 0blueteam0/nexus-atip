# DECISIONS

- Create a collection-specific promotion endpoint instead of overloading the static finding/claim review endpoint.
- Require approved Evidence through `evidence_approval_issues` before any Finding draft is created.
- Keep Finding status as `pending_review` and approval status as `pending`.
- Return `report_claim_inserted=false` and `requires_severity_approval=true` to make the boundary explicit.
- Add Korean UI copy in both the execution workflow and runtime readiness explanation panels.
