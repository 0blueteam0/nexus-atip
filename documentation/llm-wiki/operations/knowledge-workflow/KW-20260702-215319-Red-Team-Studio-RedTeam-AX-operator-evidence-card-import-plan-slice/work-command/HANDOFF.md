# Handoff

Evidence Card import planning is ready. Current artifact:

- `archive/runs/redteam-ax-v2-operator-evidence-collection/latest_operator_evidence_card_import_plan.json`
- status: `awaiting_approved_operator_evidence`
- candidate_count: `0`
- blocked_item_count: `5`

Next operator flow:

1. Produce real Docker/WSL/OpenVAS/ZAP/promotion artifacts.
2. Fill and approve operator submission manifest.
3. Run submission validator with `--require-approved`.
4. Run import plan with `--require-ready`.
5. Review candidate payloads and call `/api/redteam/v2/evidence`.
