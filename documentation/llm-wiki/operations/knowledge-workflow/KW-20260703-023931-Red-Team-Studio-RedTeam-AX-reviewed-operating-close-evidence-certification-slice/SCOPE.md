---
type: scope
task_id: KW-20260703-023931-Red-Team-Studio-RedTeam-AX-reviewed-operating-close-evidence-certification-slice
project: Red-Team-Studio
task: RedTeam AX reviewed operating close evidence certification slice
created: 2026-07-03T02:39:31+09:00
enforcement_level: L2-or-higher
---

# Scope

## User Intent

Add certification packaging for reviewed operating close evidence so completion audit can distinguish controlled test closure from real operator evidence.

## Included

- Backend API: `/api/redteam/v2/toolchains/certify-reviewed-operating-close-evidence`
- Frontend RedTeam2 Korean certification button and result tables
- Regression for missing attestation and completion-audit candidate packaging
- Completion audit, plans, wiki, sanity anchors

## Excluded

- Marking the full goal complete
- Independently proving factual real-world attestations without real external operator evidence