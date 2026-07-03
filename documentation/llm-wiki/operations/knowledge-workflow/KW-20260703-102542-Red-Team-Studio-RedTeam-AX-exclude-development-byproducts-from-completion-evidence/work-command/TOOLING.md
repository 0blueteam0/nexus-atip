---
type: work_command_record
task_id: KW-20260703-102542-Red-Team-Studio-RedTeam-AX-exclude-development-byproducts-from-completion-evidence
project: Red Team Studio
task: RedTeam AX exclude development byproducts from completion evidence
created: 2026-07-03T10:25:42+09:00
source_package: K:/wiki/work command
---

# TOOLING

## Tool Need

## Candidates

| candidate | type | benefit | risk | decision |
|---|---|---|---|---|

## Build vs Adopt

## Selected Tool

## Verification

## Tooling

- `redteam_ax_development_byproduct_exclusion_review.py`: generator and classifier.
- `test_development_byproduct_exclusion_review.py`: sanity gate.
- `test_completion_audit_matrix.py`: strengthened matrix contract.
- `redteam_ax_accepted_gate_manifest.py`: accepted gate orchestration now includes byproduct exclusion gates.
- `pytest tests/test_redteam_v2_api_router.py -q`: full API regression retained.
