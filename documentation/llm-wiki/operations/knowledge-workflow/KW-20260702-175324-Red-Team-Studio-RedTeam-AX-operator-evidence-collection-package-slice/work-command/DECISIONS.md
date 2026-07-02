# Decisions

1. Build the package from `latest_live_readiness_remediation_runbook.json` instead of duplicating blocker logic.
2. Keep the package safe-by-default: no command execution, no active scan, no secret material collection.
3. Treat package status `ready_for_operator_evidence_collection` as a blocker state until all collection items are ready.
4. Preserve RTA-COMP-015 as `partial`; the slice improves evidence collection, not actual Docker/WSL/OpenVAS/ZAP readiness.
5. Add the package generator to accepted gates so future runbook schema changes cannot silently break operator evidence collection.
