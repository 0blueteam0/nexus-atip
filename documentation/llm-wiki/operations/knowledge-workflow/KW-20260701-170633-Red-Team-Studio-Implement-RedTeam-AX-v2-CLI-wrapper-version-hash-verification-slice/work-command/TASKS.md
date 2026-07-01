---
type: work_command_record
task_id: KW-20260701-170633-Red-Team-Studio-Implement-RedTeam-AX-v2-CLI-wrapper-version-hash-verification-slice
project: Red-Team-Studio
task: Implement RedTeam AX v2 CLI wrapper version hash verification slice
created: 2026-07-01T17:06:33+09:00
source_package: K:/wiki/work command
---

# TASKS

## Original Request

Continue the active RedTeam AX v2 goal and implement the next safe slice for CLI wrapper version/hash verification while preserving ROE/HITL/guardrail behavior.

## Task

Add wrapper manifest/hash preflight support for Nuclei/OpenVAS/Trivy/SCA/npm audit/ZAP ToolProfiles. Surface manifest state in API, execution plans, and the Report Studio RedTeam2 UI.

## Status

Completed for slice 25. Remaining work is expected hash approval, operator-attested version evidence, actual runner enforcement, and live browser smoke.

## Execution Control

No scanner commands or version probes were executed. Registry read APIs use command discovery and file SHA-256 hashing only.

## Tools

`rg`, `apply_patch`, bundled Python unittest, `node --check`, `npm.cmd run build`, plan sanity script, knowledge workflow close gate.

## Verification

API regression 35 tests OK, sample E2E 1 test OK, JS syntax OK, frontend build OK, plan contract sanity OK.

