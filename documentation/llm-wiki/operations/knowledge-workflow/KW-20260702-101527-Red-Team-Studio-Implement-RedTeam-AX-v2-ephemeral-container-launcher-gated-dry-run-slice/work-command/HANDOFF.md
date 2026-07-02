---
type: work_command_record
task_id: KW-20260702-101527-Red-Team-Studio-Implement-RedTeam-AX-v2-ephemeral-container-launcher-gated-dry-run-slice
project: Red-Team-Studio
task: Implement RedTeam AX v2 ephemeral container launcher gated dry-run slice
created: 2026-07-02T10:15:27+09:00
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

Slice 31 status:
- Code implemented.
- Tests and build passed.
- Knowledge workflow pending close at the time this file was authored.

Key command path:
- Build ToolActionCard.
- Build ToolExecutionPlan with `runner_backend=ephemeral_container`.
- Ensure attestation env/payload provides container enabled, runtime, network, mount, cleanup, and image digest.
- Call `execute-governed` with issued token and `container_dry_run=true`.
- Response should be `ContainerLaunchPrepared`.

Next implementer should focus on real Docker/Podman smoke and egress enforcement.
