---
type: work_command_record
task_id: KW-20260703-023931-Red-Team-Studio-RedTeam-AX-reviewed-operating-close-evidence-certification-slice
project: Red-Team-Studio
task: RedTeam AX reviewed operating close evidence certification slice
created: 2026-07-03T02:39:31+09:00
source_package: K:/wiki/work command
---

# TOOLING

| tool | role |
|---|---|
| FastAPI router | Exposes certification endpoint. |
| React report store | Calls certification endpoint and displays evidence/attestation state. |
| pytest | Verifies backend certification gate behavior. |
| sanity scripts | Validate UI copy and audit contracts. |