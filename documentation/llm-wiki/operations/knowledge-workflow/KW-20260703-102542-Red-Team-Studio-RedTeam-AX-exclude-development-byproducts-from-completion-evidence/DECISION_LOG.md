---
type: decision_log
task_id: KW-20260703-102542-Red-Team-Studio-RedTeam-AX-exclude-development-byproducts-from-completion-evidence
project: Red Team Studio
task: RedTeam AX exclude development byproducts from completion evidence
created: 2026-07-03T10:25:42+09:00
---

# Decision Log

| time | decision | alternatives | reason | evidence |
|---|---|---|---|---|
|  |  |  |  |  |
## Decision log

- Decision: classify development byproducts rather than deleting historical regression/smoke artifacts.
- Rationale: archive/runs, smoke, sample, sanity, tests, and CASE-V2 artifacts are useful as contract and safety-control evidence, but the updated user objective says they must not count as real operating completion evidence when they do not match real work procedures.
- Decision: set byproduct rows to `completion_evidence_allowed=false` and `report_claim_evidence_allowed=false`.
- Decision: mark RTA-COMP-050 `proved` only after generating and testing the exclusion review artifact.
- Boundary: this does not complete the full goal. Real six-tool operating evidence and final report/export gates remain required.
