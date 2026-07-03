# Decision Log

- Decision: compose existing readiness/package APIs into a summary instead of bypassing them.
  Rationale: this preserves the authoritative checks and avoids a second source of truth.

- Decision: expose `does_not_mark_goal_complete=true`.
  Rationale: being ready for human review is not Evidence/Finding/Report/export completion.

- Decision: leave remaining_gaps unchanged.
  Rationale: real OpenVAS/ZAP endpoint import and real six-tool closure are still missing.