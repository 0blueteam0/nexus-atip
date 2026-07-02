---
type: knowledge_workflow_record
project: Red Team Studio
task: RedTeam AX final report export approval bridge continuation slice
evidence_scope: frontend state sync, API regression, sanity gates, accepted gate manifest
---

# SCOPE

## Goal Slice

Connect governed toolchain collection Report v2 drafts to the existing final export approval and export verification gate.

## In Scope

- RedTeam2 frontend state sync from collection Report v2 draft to final export gate state.
- Korean UI copy for collection final export approval/export flow.
- API regression test covering approve-export and export for the generated collection report.
- FINAL_PLAN, Detailed_PLAN, LLM Wiki, completion audit, and sanity anchor updates.
- Local regression and accepted gate validation.

## Out of Scope

- Running active scanners or live service imports.
- Marking all real operating Nuclei/OpenVAS/Trivy/SCA/npm audit/ZAP outputs as completed through the full export lane.
