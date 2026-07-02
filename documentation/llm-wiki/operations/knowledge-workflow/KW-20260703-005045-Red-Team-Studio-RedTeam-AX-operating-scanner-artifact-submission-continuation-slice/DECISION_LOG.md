---
type: decision_log
task_id: KW-20260703-005045-Red-Team-Studio-RedTeam-AX-operating-scanner-artifact-submission-continuation-slice
project: Red Team Studio
task: RedTeam AX operating scanner artifact submission continuation slice
created: 2026-07-03T00:50:45+09:00
---

# Decision Log

| decision | rationale | impact |
|---|---|---|
| Add a dedicated manifest import API instead of overloading inline imported-output paste. | Real scanner outputs are files with path/hash evidence; a manifest gives auditable source_path and sha256 validation. | Operating artifacts can be submitted without command execution while preserving file integrity evidence. |
| Reuse ToolActionCard, offline_parse ExecutionPlan, ToolRunRecord, and file importer. | Keeps existing ROE/HITL/guardrail and evidence storage behavior instead of creating a parallel trust path. | Import path inherits current approval, storage, sanitizer, collection, Matrix, Report, export, and completion gates. |
| Keep bad SHA-256 as step-level blocked when other artifacts are valid. | Operators may submit mixed-good manifests; preserving partial valid imports helps review while blocking tampered files. | Manifest status can be `completed_with_blocks` and does not overclaim full success. |
| Keep goal active. | Contract is proved with representative fixtures, but real organization scanner artifacts are not fully approved/exported/completion-gated. | Final response must state remaining operational evidence gap. |
