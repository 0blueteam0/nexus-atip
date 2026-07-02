---
type: decision_log
task_id: KW-20260703-010816-Red-Team-Studio-RedTeam-AX-scanner-artifact-manifest-builder-slice
project: Red Team Studio
task: RedTeam AX scanner artifact manifest builder slice
created: 2026-07-03T01:08:16+09:00
---

# Decision Log

| decision | rationale | impact |
|---|---|---|
| Build manifest from a folder, not from uploaded browser files. | Backend file import already requires workspace path and SHA-256. | Keeps evidence path auditable and compatible with existing importer. |
| Return `import_payload` instead of importing automatically. | Operator should review generated mapping before import. | Preserves HITL review and reduces wrong-file risk. |
| Keep unmatched files and alternatives. | Filename detection is helpful but not authoritative. | Operators can notice files that were ignored or duplicated. |
