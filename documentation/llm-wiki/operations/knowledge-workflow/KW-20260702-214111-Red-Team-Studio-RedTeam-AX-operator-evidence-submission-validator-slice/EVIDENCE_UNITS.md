---
type: evidence_units
project: Red Team Studio
task: RedTeam AX operator evidence submission validator slice
---

# Evidence Units

| id | kind | path_or_command | result |
|---|---|---|---|
| EV-001 | artifact | `archive/runs/redteam-ax-v2-operator-evidence-collection/latest_operator_evidence_submission_validation.json` | `awaiting_operator_evidence_submission`, 5 blocked items |
| EV-002 | artifact | `archive/runs/redteam-ax-v2-operator-evidence-collection/latest_operator_evidence_submission_validation.md` | Markdown validation report |
| EV-003 | test | runtime readiness projection pytest | 1 passed |
| EV-004 | test | frontend runtime readiness contract | passed |
| EV-005 | test | Korean copy inventory | passed |
| EV-006 | test | completion audit and plan contract | passed |
| EV-007 | gate | `latest_accepted_gate_manifest.json` | 21 accepted, 21 passed, 0 failed |
