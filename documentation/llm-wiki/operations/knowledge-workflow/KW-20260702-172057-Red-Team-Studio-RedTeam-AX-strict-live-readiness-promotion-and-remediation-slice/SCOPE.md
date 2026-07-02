---
type: scope
task_id: KW-20260702-172057-Red-Team-Studio-RedTeam-AX-strict-live-readiness-promotion-and-remediation-slice
project: Red Team Studio
task: RedTeam AX strict live readiness promotion and remediation slice
created: 2026-07-02T17:20:57+09:00
enforcement_level: L2-or-higher
---

# Scope

## User Intent

Continue the RedTeam AX objective by making the final live-readiness promotion requirement explicit, executable, visible in Korean UI, and backed by artifacts.

## Included

- Add a strict live readiness promotion script that rolls up Docker real container, WSL ready, external scanner readiness, and external scanner import live gates.
- Keep safe defaults: no real container or network promotion without explicit flags.
- Project the promotion artifact through `/api/redteam/v2/runtime-readiness`.
- Show promotion status in RedTeam2 runtime readiness panel.
- Update accepted gate, plan, LLM wiki, and completion audit.

## Excluded

- No Docker repair.
- No WSL repair.
- No organization OpenVAS/ZAP endpoint provisioning.
- No active scan.

## Verification Criteria

| criterion | evidence_required |
|---|---|
| Promotion artifact generated | `latest_strict_live_readiness_promotion.json` |
| API/UI contract updated | pytest and frontend contract |
| Accepted gates pass | `latest_accepted_gate_manifest.json` |
| Gate closed | `QUALITY_GATE_RESULT.json` |
