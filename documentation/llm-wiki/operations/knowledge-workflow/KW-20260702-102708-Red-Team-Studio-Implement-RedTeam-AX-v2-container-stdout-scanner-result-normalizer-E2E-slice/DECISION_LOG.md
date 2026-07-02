---
type: decision_log
task_id: KW-20260702-102708-Red-Team-Studio-Implement-RedTeam-AX-v2-container-stdout-scanner-result-normalizer-E2E-slice
project: Red-Team-Studio
task: Implement RedTeam AX v2 container stdout scanner result normalizer E2E slice
created: 2026-07-02T10:27:08+09:00
---

# Decision Log

| time | decision | alternatives | reason | evidence |
|---|---|---|---|---|
|  |  |  |  |  |
# Decision Log

## D-001 Combine launch and scanner parsers

- Decision: return both `container_launch_evidence` and scanner candidate items when both artifacts exist.
- Reason: execution-control evidence and scanner results prove different claims.
- Impact: Evidence Card candidates preserve both guardrail context and scanner result context.

## D-002 Use mock stdout only for dry-run rehearsal

- Decision: add `container_mock_stdout`/`container_mock_stderr` only to dry-run path.
- Reason: tests can prove parser E2E without Docker/Podman or active scanners.
- Impact: real runtime smoke remains a separate explicit milestone.
