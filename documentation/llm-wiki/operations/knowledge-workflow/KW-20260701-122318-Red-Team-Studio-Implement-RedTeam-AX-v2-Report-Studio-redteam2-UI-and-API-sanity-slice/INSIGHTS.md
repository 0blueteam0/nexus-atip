---
type: insights
task_id: KW-20260701-122318-Red-Team-Studio-Implement-RedTeam-AX-v2-Report-Studio-redteam2-UI-and-API-sanity-slice
project: Red Team Studio
---

# Insights

- The existing frontend is concentrated in `reports.js`; a first slice can be delivered without cross-component refactoring.
- The v1 backend already has useful policy/evidence/report primitives; v2 should wrap new contracts first, then progressively reuse stable v1 modules.
- The biggest remaining product risk is not endpoint availability but proving the full chain: ToolActionCard -> manual run record -> EvidenceCard -> Claim-Evidence Matrix -> Korean Report v2 -> release gate.
- Live UI verification remains necessary because source/build success does not prove 5177 tab rendering or interaction behavior.
