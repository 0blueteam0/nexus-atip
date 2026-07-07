---
type: work_command_record
task_id: KW-20260707-124908-Red-Team-Studio-Continue-RedTeam-AX-promote-sigma-cli-install-candidate-toward-governed-frontend
project: Red Team Studio
task: Continue RedTeam AX promote sigma-cli install candidate toward governed frontend execution
created: 2026-07-07T12:49:08+09:00
source_package: K:/wiki/work command
---

# DECISIONS

## D1 - Optional, Not Required

Decision: Sigma CLI is an optional runner profile, not a required six-tool completion item.

Reason: It helps detection engineering but does not replace Nuclei/OpenVAS/Trivy/SCA/npm audit/ZAP.

## D2 - Local Check Only

Decision: The frontend preset runs `sigma check` on a local repository sample rule only.

Reason: This proves installed-tool button execution without introducing plugin install, remote download, or SIEM deployment risk.

## Ledger

| id | decision | alternatives | reason | impact |
|---|---|---|---|---|

## Entries
