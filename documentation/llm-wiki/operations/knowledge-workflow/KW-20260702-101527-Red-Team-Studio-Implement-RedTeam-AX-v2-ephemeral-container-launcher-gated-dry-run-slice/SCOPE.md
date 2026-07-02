---
type: scope
task_id: KW-20260702-101527-Red-Team-Studio-Implement-RedTeam-AX-v2-ephemeral-container-launcher-gated-dry-run-slice
project: Red-Team-Studio
task: Implement RedTeam AX v2 ephemeral container launcher gated dry-run slice
created: 2026-07-02T10:15:27+09:00
enforcement_level: L2-or-higher
---

# Scope

## User Intent

Describe the user's request as an operational task.

## Included

- 

## Excluded

- Only explicitly excluded items belong here. Default is include.

## Work Units

| unit | description | expected_artifact |
|---|---|---|
|  |  |  |

## Required Artifacts

| artifact | path | purpose |
|---|---|---|
|  |  |  |

## Verification Criteria

| criterion | evidence_required |
|---|---|
| Scope declared | `SCOPE.md` |
| Evidence recorded | `EVIDENCE_UNITS.md` |
| Gate closed | `QUALITY_GATE_RESULT.json` |

## Completion Definition

The task is complete only when scope, artifacts, evidence, decisions, handoff, and gate result exist.
# Scope

- Project: Red-Team-Studio
- Task: Implement RedTeam AX v2 ephemeral container launcher gated dry-run slice
- Slice: 31

## In Scope

- Add an ephemeral container launcher path behind existing ToolExecutionPlan and issued execution token checks.
- Treat container image digest attestation as the trust root for container backend, instead of host wrapper SHA-256.
- Build Docker/Podman argv with deny-by-default network, read-only workspace mount, case write mount, no privileged mode, no shell expansion, and resource limits.
- Add dry-run mode that writes a container launch plan artifact without invoking Docker/Podman.
- Preserve local subprocess shim behavior for existing regression tests.
- Update RedTeam2 UI runner result rows and FINAL_PLAN.

## Out of Scope

- Live Docker/Podman runtime execution smoke.
- Real network namespace allowlist implementation beyond `--network none`.
- Container stdout/stderr scanner normalizer E2E.
- Browser smoke on 5177/8765.
