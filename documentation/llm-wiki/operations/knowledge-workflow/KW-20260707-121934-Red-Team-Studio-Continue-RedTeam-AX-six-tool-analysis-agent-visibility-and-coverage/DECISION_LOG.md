# Decision Log

- Decision: do not treat `result_id` alone as analysis agent coverage.
  - Reason: the user requires each tool to have an LLM-linked analysis agent.
- Decision: expose agent coverage separately from evidence coverage.
  - Reason: Evidence approval, Finding approval, and report claims are later gates.
- Decision: keep UI Korean and beginner-first.
  - Reason: the objective requires Korean display for lower-expertise users.
