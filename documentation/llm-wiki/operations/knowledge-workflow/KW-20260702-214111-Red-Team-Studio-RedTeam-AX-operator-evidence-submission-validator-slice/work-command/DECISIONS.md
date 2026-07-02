# Decisions

1. The validator reads local JSON artifacts only; it does not execute validation commands from the package.
2. A missing submission manifest is a normal safe default state, recorded as `awaiting_operator_evidence_submission`.
3. `--require-approved` is reserved for strict operator validation and exits non-zero when any item is missing, hash-mismatched, status-mismatched, or not approved.
4. Runtime readiness includes submission validation blockers so the UI does not imply evidence has been attached.
5. RTA-COMP-015 remains partial because this slice validates submitted evidence but does not create real Docker/WSL/OpenVAS/ZAP evidence.
