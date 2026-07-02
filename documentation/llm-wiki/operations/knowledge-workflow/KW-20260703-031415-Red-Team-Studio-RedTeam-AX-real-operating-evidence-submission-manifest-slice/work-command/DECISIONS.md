---
type: work_command_record
task_id: KW-20260703-031415-Red-Team-Studio-RedTeam-AX-real-operating-evidence-submission-manifest-slice
project: Red Team Studio
task: RedTeam AX real operating evidence submission manifest slice
created: 2026-07-03T03:14:15+09:00
source_package: K:/wiki/work command
---

# DECISIONS

## Decision 1

Implement a draft builder API instead of mutating the validator result artifact directly.

## Rationale

The validator is the approval gate. The API should prepare evidence metadata, not approve it.

## Decision 2

Default `review_status` to `pending_human_review` and keep `does_not_mark_goal_complete=true`.

## Rationale

Hash/status matches are technical checks. They are not human approval or final completion evidence.

## Decision 3

Persist a standalone `submission_manifest_artifact_path`.

## Rationale

The operator needs a stable path to pass to `redteam_ax_operator_evidence_submission_validator.py --submission-manifest <path> --require-approved`.
