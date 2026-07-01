---
type: work_command_record
task_id: KW-20260701-164153-Red-Team-Studio-Implement-RedTeam-AX-v2-image-OCR-sensitive-visual-redaction-preview-slice
project: Red-Team-Studio
task: Implement RedTeam AX v2 image OCR sensitive visual redaction preview slice
created: 2026-07-01T16:41:53+09:00
source_package: K:/wiki/work command
---

# TOOLING

## Tool Need

Implement and verify a scoped RedTeam AX code/documentation slice without broad file churn.

## Candidates

| candidate | type | benefit | risk | decision |
|---|---|---|---|---|
| `rg` | search | Fast local code/spec discovery | none | selected |
| `apply_patch` | edit | Precise diffs | patch context can fail | selected |
| unittest | test | Existing backend contract | warning from Starlette deprecation | selected |
| Vite build | build | Frontend compile check | large chunk warning | selected |
| OCR engine | dependency | Actual extraction | version/hash/platform risk | deferred |

## Build vs Adopt

Adopt existing sanitizer/archive/test patterns. Defer OCR engine adoption until a dedicated dependency-pinning slice.

## Selected Tool

Existing local Python/Node toolchain and repository test suite.

## Verification

All selected verification commands exited 0.

