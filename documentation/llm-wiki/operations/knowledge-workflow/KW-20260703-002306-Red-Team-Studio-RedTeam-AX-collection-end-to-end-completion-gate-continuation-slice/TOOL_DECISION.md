---
type: knowledge_workflow_record
project: Red Team Studio
task: RedTeam AX collection end-to-end completion gate continuation slice
---

# TOOL_DECISION

- Used a read-only verifier endpoint rather than an auto-run pipeline because HITL approvals must remain explicit.
- Reused existing artifact categories: toolchain-result-collections, reports, report-export-approvals, exports.
- Used project `.venv` for pytest.
- Did not execute Docker, WSL, scanner binaries, OpenVAS, or ZAP.
