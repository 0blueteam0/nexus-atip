---
type: scope
task_id: KW-20260702-214111-Red-Team-Studio-RedTeam-AX-operator-evidence-submission-validator-slice
project: Red Team Studio
task: RedTeam AX operator evidence submission validator slice
created: 2026-07-02T21:41:11+09:00
enforcement_level: L2-or-higher
---

# Scope

## User Intent

Continue RedTeam AX toward governed live readiness by adding a validator for operator-submitted evidence manifests. The validator must check evidence artifact path, SHA-256, expected status, and human approval without executing Docker, WSL, scanner, MCP, or network commands.

## Included

- Operator evidence submission validation sanity script.
- Runtime readiness API projection for submission validation.
- RedTeam2 Korean UI labels/table for submission validation status.
- Accepted gate entry and Python compile coverage.
- FINAL_PLAN, Detailed_PLAN, LLM wiki, completion audit updates.

## Excluded

- Actual Docker daemon repair.
- WSL distro repair.
- Organization OpenVAS/ZAP endpoint/vault provisioning.
- Active scan execution or network scanner calls.

## Verification Criteria

| criterion | evidence_required |
|---|---|
| Validator artifact exists | `latest_operator_evidence_submission_validation.json` |
| API projection covers validator | runtime readiness pytest |
| UI labels covered | frontend runtime readiness contract and Korean inventory |
| Gate set updated | accepted gate manifest 21/21 |
| Goal not overclaimed | completion audit remains `active_incomplete` with RTA-COMP-015 partial |
