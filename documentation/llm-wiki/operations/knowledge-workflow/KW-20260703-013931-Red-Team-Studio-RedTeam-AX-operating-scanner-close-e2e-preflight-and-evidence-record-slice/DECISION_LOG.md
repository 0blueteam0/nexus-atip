# Decision Log

## D-001 Compose Existing Gates

- decision: Compose manifest builder, manifest import, result collection, and close-e2e.
- reason: It preserves Evidence/Finding/Matrix/Report/export semantics and avoids duplicate gate logic.

## D-002 Keep Scanner Execution Out

- decision: Do not execute scanner binaries, Docker, WSL, shell expansion, active scans, or network probes in the new API.
- reason: The API is for already-produced operating artifacts and must stay HITL/guardrail aligned.

## D-003 Keep Goal Active

- decision: Do not mark the thread goal complete.
- reason: Controlled fixture closure does not prove actual organization scanner output, actual endpoint readiness, or real approver evidence.
