---
type: scope
task_id: KW-20260702-215319-Red-Team-Studio-RedTeam-AX-operator-evidence-card-import-plan-slice
project: Red Team Studio
task: RedTeam AX operator evidence card import plan slice
created: 2026-07-02T21:53:19+09:00
enforcement_level: L2-or-higher
---

# Scope

## User Intent

Continue RedTeam AX toward Evidence Card and Claim-Evidence Matrix traceability by turning validated operator evidence submissions into safe Evidence Card candidate payloads.

## Included

- Operator Evidence Card import plan sanity script.
- Runtime readiness projection for import plan artifact.
- RedTeam2 Korean UI cards/table for Evidence Card candidate plan.
- Accepted gate entry and compile coverage.
- FINAL_PLAN, Detailed_PLAN, LLM wiki, completion audit updates.

## Excluded

- Automatic Evidence Card creation.
- Human approval bypass.
- Docker, WSL, OpenVAS, ZAP, network, MCP, or scanner execution.

## Verification Criteria

| criterion | evidence_required |
|---|---|
| Import plan artifact exists | `latest_operator_evidence_card_import_plan.json` |
| API projection covers artifact | runtime readiness pytest |
| UI copy covered | frontend contract and Korean inventory |
| Gate set updated | accepted gate manifest 22/22 |
| Goal not overclaimed | completion audit remains active_incomplete |
