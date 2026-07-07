---
type: decision_log
task_id: KW-20260707-124908-Red-Team-Studio-Continue-RedTeam-AX-promote-sigma-cli-install-candidate-toward-governed-frontend
project: Red Team Studio
task: Continue RedTeam AX promote sigma-cli install candidate toward governed frontend execution
created: 2026-07-07T12:49:08+09:00
---

# Decision Log

## D1 - Optional Profile

Decision: Register Sigma CLI as `required_for_core_coverage=false`.

Impact: It appears in analysis tools, readiness, launch buttons, and execution presets, but required six-tool completion remains Nuclei/OpenVAS/Trivy/SCA/npm audit/ZAP.

## D2 - Local Rule Check Only

Decision: The first Sigma preset runs `sigma check` against a local repository sample rule.

Impact: No network scan, plugin install, remote rule download, or SIEM deployment is performed.

| time | decision | alternatives | reason | evidence |
|---|---|---|---|---|
|  |  |  |  |  |
