---
type: work_command_record
task_id: KW-20260707-123728-Red-Team-Studio-Continue-RedTeam-AX-broaden-official-redteam-tool-install-candidate-catalog
project: Red Team Studio
task: Continue RedTeam AX broaden official redteam tool install candidate catalog
created: 2026-07-07T12:37:28+09:00
source_package: K:/wiki/work command
---

# DECISIONS

## D1 - Candidate First

Decision: Add the broad SPEC 24 tool set as install/onboarding candidates, not executable ToolProfiles.

Rationale: This satisfies the user's priority to keep discovering/installing tools while respecting RedTeam AX's ROE/HITL/guardrail model.

Impact: The frontend can show the extended onboarding backlog, but no new button can run these tools yet.

## D2 - Safer Promotion Order

Decision: Recommend promoting bounded lower-risk candidates such as subfinder, sigma-cli, or gitleaks before high-risk emulation/endpoint tools.

Rationale: These candidates can be constrained with domain scope, rule conversion, or local repository artifact scanning more easily than Caldera, Stratus, Velociraptor, Certipy, or OpenBAS.

## Ledger

| id | decision | alternatives | reason | impact |
|---|---|---|---|---|

## Entries
