---
type: scope
task_id: KW-20260703-003603-Red-Team-Studio-RedTeam-AX-live-scanner-collection-completion-continuation-slice
project: Red Team Studio
task: RedTeam AX live scanner collection completion continuation slice
created: 2026-07-03T00:36:03+09:00
enforcement_level: L2-or-higher
---

# Scope

## Included

- Add a governed imported-output path for RedTeam AX toolchain steps.
- Prove Nuclei, OpenVAS, Trivy, SCA, npm audit, and OWASP ZAP representative operator/service outputs can pass one collection E2E lane.
- Update Korean RedTeam2 UI, plan docs, LLM Wiki, completion audit, and sanity anchors.

## Excluded

- No Docker daemon repair.
- No live organization OpenVAS/ZAP endpoint call.
- No active scan execution.
- No claim that the full active goal is complete.

## Completion Definition

This slice is complete when code, tests, docs, audit, accepted gates, knowledge workflow close, handoff, commit, and push complete. The thread goal remains active until real operating scanner outputs pass the same lane.
