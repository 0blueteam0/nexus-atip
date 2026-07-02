---
type: work_command_record
task_id: KW-20260703-033230-Red-Team-Studio-RedTeam-AX-next-operating-evidence-closure-slice
project: Red Team Studio
task: RedTeam AX next operating evidence closure slice
created: 2026-07-03T03:32:30+09:00
updated: 2026-07-03T04:24:00+09:00
source_package: K:/wiki/work command
---

# DECISIONS

## Decision 1

Add a dedicated `operator-evidence-card-import` API instead of folding the work into report export. This keeps the evidence lifecycle explicit.

## Decision 2

Created Evidence Cards remain `pending_review` by default. Approval is separate and requires reviewer identity, role, actor context headers, and `human_review_confirmed`.

## Decision 3

If approval mode is requested without human review confirmation, the request is blocked before Evidence Cards are created. This prevents blocked review requests from leaving write side effects.

## Evidence

The decisions are covered by `tests/test_redteam_v2_api_router.py::RedTeamV2ApiRouterTests::test_v2_operator_evidence_card_import_creates_and_approves_candidates_with_human_review`.
