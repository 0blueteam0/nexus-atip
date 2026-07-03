---
type: scope
task_id: KW-20260703-130938-Red-Team-Studio-RedTeam-AX-frontend-six-tool-coverage-visibility-continuation
project: Red Team Studio
task: RedTeam AX frontend six tool coverage visibility continuation
created: 2026-07-03T13:09:38+09:00
enforcement_level: L2-or-higher
---

# Scope

## User Intent

Continue the active RedTeam AX goal by making the six required tool coverage gate visible in the Korean RedTeam2 frontend.

## Included

- Add Korean UI rows for required six-tool coverage and missing required tools.
- Add a RedTeam2 table for required analysis tool coverage rows.
- Update frontend sanity contracts and Korean copy inventory.
- Update FINAL_PLAN, Detailed_PLAN, LLM Wiki, and completion audit.
- Verify syntax, sanity, targeted API regressions, and goal review.

## Excluded

- Do not claim the full active goal is complete.
- Do not execute scanners, active scans, OpenVAS live imports, OWASP ZAP scans, Docker, WSL, or network actions.
- Do not treat UI visibility as real operating evidence.

## Verification Criteria

| criterion | evidence_required |
|---|---|
| Frontend syntax valid | `node --check reports.js` |
| Frontend coverage copy present | frontend sanity scripts |
| Backend coverage unchanged | targeted pytest |
| Goal still blocked | goal-completion-review output |
| KW gate closed | `QUALITY_GATE_RESULT.json` |
