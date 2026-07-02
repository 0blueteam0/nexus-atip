---
type: insights
project: Red Team Studio
task: RedTeam AX operator evidence submission validator slice
---

# Insights

- Collection package and submission validation should stay separate: one tells the operator what to collect, the other verifies what was attached.
- SHA-256, expected artifact status, and human review status are enough for a safe first validation lane without adding a new backend upload surface.
- Keeping the validator in accepted gates prevents readiness UI from claiming submitted evidence when no reviewed manifest exists.
