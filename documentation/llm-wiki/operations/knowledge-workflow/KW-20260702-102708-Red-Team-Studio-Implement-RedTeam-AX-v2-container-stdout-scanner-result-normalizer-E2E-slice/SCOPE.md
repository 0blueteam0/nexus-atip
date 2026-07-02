---
type: scope
task_id: KW-20260702-102708-Red-Team-Studio-Implement-RedTeam-AX-v2-container-stdout-scanner-result-normalizer-E2E-slice
project: Red-Team-Studio
task: Implement RedTeam AX v2 container stdout scanner result normalizer E2E slice
created: 2026-07-02T10:27:08+09:00
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
- Task: Implement RedTeam AX v2 container stdout scanner result normalizer E2E slice
- Slice: 33

## In Scope

- Allow dry-run container launcher to write mock stdout/stderr artifacts for governed test rehearsals.
- Combine container launch evidence parsing with tool-specific scanner output parsing.
- Verify Trivy stdout JSON from a container run becomes `sca_vulnerability_candidate`.
- Preserve `container_launch_evidence` in the same normalized result.
- Ensure Evidence Card candidate keeps both launch-control and scanner candidate items.

## Out of Scope

- Real Docker/Podman execution.
- Real scanner invocation.
- Browser smoke.
- Nuclei/ZAP/OpenVAS container stdout smoke.
