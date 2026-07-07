---
type: work_command_record
task_id: KW-20260707-123728-Red-Team-Studio-Continue-RedTeam-AX-broaden-official-redteam-tool-install-candidate-catalog
project: Red Team Studio
task: Continue RedTeam AX broaden official redteam tool install candidate catalog
created: 2026-07-07T12:37:28+09:00
source_package: K:/wiki/work command
---

# HANDOFF

## Summary

Expanded `DISCOVERED_TOOL_INSTALL_CANDIDATES` from the previous small set to a SPEC 24-aligned multi-layer catalog. The API readiness endpoint now exposes more than 20 candidates while preserving non-execution flags.

## Files

- `projects/ai-agentic-soc/runtime/redteam_v2_models.py`
- `projects/ai-agentic-soc/tests/test_redteam_v2_api_router.py`
- `projects/ai-agentic-soc/Red Team Studio/Detailed_PLAN.MD`
- `projects/ai-agentic-soc/Red Team Studio/FINAL_PLAN.md`

## Verification

Python compile, targeted pytest, Node syntax, frontend runtime sanity, frontend launch sanity, and git diff check passed.

## Next Action

Promote one candidate at a time into actual installation/runtime support. Each promotion needs real install verification, wrapper pinning, ToolProfile, normalizer, Evidence Card mapping, Claim-Evidence Matrix mapping, frontend button contract, and regression tests.

## Original Request

## Current Interpretation

## Current State

## Decision Record

## Execution Record

## Tools And Capability

## Next Actions
