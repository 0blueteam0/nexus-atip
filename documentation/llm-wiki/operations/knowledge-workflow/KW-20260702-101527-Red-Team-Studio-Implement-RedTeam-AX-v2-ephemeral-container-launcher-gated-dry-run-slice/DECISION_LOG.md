---
type: decision_log
task_id: KW-20260702-101527-Red-Team-Studio-Implement-RedTeam-AX-v2-ephemeral-container-launcher-gated-dry-run-slice
project: Red-Team-Studio
task: Implement RedTeam AX v2 ephemeral container launcher gated dry-run slice
created: 2026-07-02T10:15:27+09:00
---

# Decision Log

| time | decision | alternatives | reason | evidence |
|---|---|---|---|---|
|  |  |  |  |  |
# Decision Log

## D-001 Add launcher dry-run before real Docker smoke

- Decision: implement the actual launcher command path but validate it through dry-run artifact generation.
- Reason: the repository test environment may not have Docker/Podman, and status APIs must stay side-effect-free.
- Impact: the execution path is now wired through PlanReady and issued token, while real runtime execution remains explicit future work.

## D-002 Use image digest as container backend trust root

- Decision: do not require host wrapper SHA-256 pin when `runner_backend=ephemeral_container`.
- Reason: the scanner command will execute inside a pinned container image; host wrapper presence is not the relevant executable artifact.
- Impact: attested container plans can issue tokens even if the host CLI is not installed.
