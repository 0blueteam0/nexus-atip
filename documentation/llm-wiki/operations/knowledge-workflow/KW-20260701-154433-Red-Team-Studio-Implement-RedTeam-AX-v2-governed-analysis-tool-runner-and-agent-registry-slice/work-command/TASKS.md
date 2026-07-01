---
type: work_command_record
task_id: KW-20260701-154433-Red-Team-Studio-Implement-RedTeam-AX-v2-governed-analysis-tool-runner-and-agent-registry-slice
project: Red Team Studio
task: Implement RedTeam AX v2 governed analysis tool runner and agent registry slice
created: 2026-07-01T15:44:33+09:00
updated: 2026-07-01T16:05:00+09:00
source_package: K:/wiki/work command
---

# TASKS

## Original Request

Continue the RedTeam AX goal using `SPEC` and `Agentic RAG SPEC`, including Nuclei, OpenVAS, Trivy, SCA, npm audit, and OWASP ZAP integration with LLM analysis agents.

## Task

1. Read relevant tooling/security/RAG specs.
2. Add ToolProfile registry for requested tools.
3. Add per-tool LLM analysis agent registry.
4. Add governed execution and agent normalization APIs.
5. Surface ToolHub in `레드팀 분석2`.
6. Test backend, frontend, live API, live UI.

## Status

Implemented and verified locally. Commit/push remains.

## Execution Control

No real scanner was launched against a target. Active scanner execution is approval-gated and records/imports outputs as ToolRunRecord artifacts.

## Tools

PowerShell, `rg`, `apply_patch`, project `.venv`, npm/Vite, Playwright.

## Verification

27 v2 tests OK, 1 sample E2E OK, frontend build OK, live API/UI smoke OK, plan sanity OK.
