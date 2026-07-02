---
type: knowledge_workflow_record
project: Red Team Studio
task: RedTeam AX final report export approval bridge continuation slice
---

# TOOL_DECISION

## Decisions

- Used existing backend report export approval APIs instead of adding collection-specific duplicate endpoints.
- Used project `.venv` for pytest because default and bundled Python lacked pytest.
- Did not invoke scanners, Docker, WSL, OpenVAS, or ZAP live commands.
- Used accepted gate script only as a verifier; changed latest runtime artifacts outside this slice are not intended for staging unless explicitly selected.
