---
type: decision_log
task_id: KW-20260702-102144-Red-Team-Studio-Implement-RedTeam-AX-v2-container-launch-evidence-normalization-E2E-slice
project: Red-Team-Studio
task: Implement RedTeam AX v2 container launch evidence normalization E2E slice
created: 2026-07-02T10:21:44+09:00
---

# Decision Log

| time | decision | alternatives | reason | evidence |
|---|---|---|---|---|
|  |  |  |  |  |
# Decision Log

## D-001 Normalize launch plan as control evidence

- Decision: parse container launch plan JSON into `container_launch_evidence`, not scanner findings.
- Reason: a dry-run launch plan proves guardrail configuration, not target exposure or compromise.
- Impact: report claims still need human validation and Evidence Card approval.

## D-002 Read source_path_or_ref for local runner outputs

- Decision: allow local `source_path_or_ref` paths to be read with hash validation.
- Reason: governed runner artifacts are written directly by the backend and referenced this way.
- Impact: runner-generated artifacts can flow through sanitizer, parser, normalized result, and Evidence Card creation.
