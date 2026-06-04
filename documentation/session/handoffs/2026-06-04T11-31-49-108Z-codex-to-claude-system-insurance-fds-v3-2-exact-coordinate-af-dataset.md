---
type: llm_system_handoff
id: 2026-06-04T11-31-49-108Z-codex-to-claude-system-insurance-fds-v3-2-exact-coordinate-af-dataset
status: completed
from: codex
to: claude
created_at: 2026-06-04T11:31:49.108Z
title: "Insurance FDS v3.2 exact-coordinate AF dataset"
---

# codex -> claude System Handoff: Insurance FDS v3.2 exact-coordinate AF dataset

## Summary

Added a v3.2 insurance FDS generator that creates AF samples by copying the paired NO source image and overwriting only the exact original field bbox, with pair manifest and pixel-diff validation.

## Artifact Paths

- scripts/insurance_fds_exact_coordinate_pipeline.py
- tests/test_insurance_fds_exact_coordinate_pipeline.py
- data/insurance-fds-generated/field-pseudonymized-v3.2-exact-coordinate-overwrite

## Documents To Read

- documentation/reports/INSURANCE_FDS_EXACT_COORDINATE_V3_2_REPORT.ko.md

## Decisions

- AF must be created from paired NO image and rewrite only the original bbox, not shifted boxes or separate overlays.

## Verification

- pytest tests/test_insurance_fds_exact_coordinate_pipeline.py -q -> 2 passed
- python scripts/insurance_fds_exact_coordinate_pipeline.py --template-cases 8 -> NO 32 AF 32 pairs 32 validation mismatch 0
- insurance FDS suite -> 25 passed

## Risks And Limits

- v3.2 is synthetic-template exact-coordinate data; real-image OCR/KIE exact-coordinate extension remains next work.

## Next Actions

- Extract field bboxes from quarantined real-image candidates with OCR/KIE, pseudonymize, then apply the same exact-coordinate overwrite policy.

## Git Context

- branch: main
- hash: 6913ec0

## Receiver Resume Prompt

```text
claude should continue from this system handoff.
Created by: codex
System: Insurance FDS v3.2 exact-coordinate AF dataset
Summary: Added a v3.2 insurance FDS generator that creates AF samples by copying the paired NO source image and overwriting only the exact original field bbox, with pair manifest and pixel-diff validation.
Read these paths first:
- documentation/reports/INSURANCE_FDS_EXACT_COORDINATE_V3_2_REPORT.ko.md
Then check the next actions and verification section before editing.
```
