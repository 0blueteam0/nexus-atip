---
type: work_command_record
task_id: KW-20260708-094551-Red-Team-Studio-Continue-RedTeam-AX-static-analysis-runner-promotion-with-Semgrep
project: Red Team Studio
task: Continue RedTeam AX static analysis runner promotion with Semgrep
created: 2026-07-08T09:45:51+09:00
source_package: K:/wiki/work command
---

# HANDOFF

## Original Request

## Current Interpretation

## Current State

## Decision Record

## Execution Record

## Tools And Capability

## Next Actions

# Work Command Handoff

Next agent should read `runtime/redteam_v2_models.py` around `TOOL-SEMGREP-001`, `PRESET-SEMGREP-LOCAL-RULE-SAMPLE`, `_normalize_semgrep_output`, and `command_availability`.

Semgrep install root is intentionally untracked runtime state under `Red Team Studio/고도화/tool-runtimes/semgrep_1.168.0_venv`. The committed manifest records how to recreate it and pins the executable hash.

Continue the larger goal by selecting the next red-team tool family and applying the same pattern: official source check, isolated install when needed, safe preset, Evidence normalizer, Korean beginner UI, tests, gate, handoff, commit, push.
