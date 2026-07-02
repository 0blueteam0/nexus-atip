---
type: handoff
project: Red Team Studio
task: RedTeam AX operator evidence card import plan slice
---

# Handoff

Evidence Card import planning is implemented. Current status is `awaiting_approved_operator_evidence`.

Next operator flow:
1. Produce and approve real Docker/WSL/OpenVAS/ZAP/promotion evidence artifacts.
2. Validate submission manifest with `--require-approved`.
3. Run `redteam_ax_operator_evidence_card_import_plan.py --require-ready`.
4. Review candidate payloads and call `/api/redteam/v2/evidence`.
5. Approve Evidence Cards before using them in Claim-Evidence Matrix or Findings.
