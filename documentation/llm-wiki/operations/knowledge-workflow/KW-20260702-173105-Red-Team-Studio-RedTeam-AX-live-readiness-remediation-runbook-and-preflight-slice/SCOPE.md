---
type: scope
task_id: KW-20260702-173105-Red-Team-Studio-RedTeam-AX-live-readiness-remediation-runbook-and-preflight-slice
project: Red Team Studio
task: RedTeam AX live readiness remediation runbook and preflight slice
created: 2026-07-02T17:31:05+09:00
enforcement_level: L2-or-higher
---

# Scope

## User Intent

Continue RedTeam AX toward real live readiness by turning current strict promotion blockers into an operator runbook with verification commands and evidence requirements.

## Included

- Generate JSON and Markdown remediation runbook artifacts.
- Project runbook through runtime readiness API.
- Show Korean runbook status in RedTeam2.
- Add accepted gate and plan/wiki/audit updates.

## Excluded

No Docker repair, WSL repair, endpoint provisioning, secret handling, active scan, or network import.

## Verification Criteria

| criterion | evidence_required |
|---|---|
| Runbook generated | `latest_live_readiness_remediation_runbook.json` |
| API/UI contract updated | pytest and frontend contract |
| Accepted gates pass | `latest_accepted_gate_manifest.json` |
