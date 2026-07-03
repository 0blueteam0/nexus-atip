---
type: work_command_record
task_id: KW-20260703-141648-Red-Team-Studio-RedTeam-AX-frontend-safe-installed-tool-smoke-button-continuation
project: Red-Team-Studio
task: RedTeam AX frontend safe installed tool smoke button continuation
created: 2026-07-03T14:16:48+09:00
updated: 2026-07-03T14:45:00+09:00
source_package: K:/wiki/work command
---

# DECISIONS

## Decision 1

Use the existing `/api/redteam/v2/toolchains/execute-governed` route instead of adding another execution API.

## Evidence Fields

- command: `node --check reports.js`
- exit_code: 0
- artifact_path: `J:/PortableApps/genai/projects/ai-agentic-soc/soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js`
- verified_at: 2026-07-03T14:45:00+09:00

## Decision 2

The button auto-generates only version-only smoke commands for Nuclei, Trivy, and npm audit.

## Evidence Fields

- command: `redteam_ax_frontend_runtime_readiness_contract.py`
- exit_code: 0
- artifact_path: `J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/sanity/redteam_ax_frontend_runtime_readiness_contract.py`
- verified_at: 2026-07-03T14:45:00+09:00
