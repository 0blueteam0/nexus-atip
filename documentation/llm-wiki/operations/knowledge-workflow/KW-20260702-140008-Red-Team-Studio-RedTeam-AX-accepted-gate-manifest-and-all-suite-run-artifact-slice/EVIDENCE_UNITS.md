---
type: evidence_unit
status: draft
id:
project: Red-Team-Studio
created: 2026-07-02T14:00:08+09:00
---

# Evidence Unit

## Claim

## Source

- source_type:
- path_or_url:
- command:
- exit_code:
- collected_at:

## Evidence

## Confidence

## Limits

## Related Decisions



## Autofill Evidence Unit

Claim: RedTeam AX accepted gate manifest slice: added a machine-checkable harness, generated latest accepted gate manifest with 9/9 gates passing, updated completion audit RTA-COMP-012 to proved, and left scanner/container live smoke as the only remaining completion gap.

Source:
- source_type: local_session
- path_or_url: J:\PortableApps\genai\documentation\llm-wiki\operations\knowledge-workflow\KW-20260702-140008-Red-Team-Studio-RedTeam-AX-accepted-gate-manifest-and-all-suite-run-artifact-slice
- command: knowledge_workflow.py autofill
- exit_code: pending_until_close
- collected_at: 2026-07-02T15:04:17+09:00

Evidence artifacts:
- J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/sanity/redteam_ax_accepted_gate_manifest.py
- J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-accepted-gates/latest_accepted_gate_manifest.json
- J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/completion-audit/redteam_ax_completion_audit_matrix.json

Command evidence:
- ../.venv/Scripts/python.exe 고도화/sanity/redteam_ax_accepted_gate_manifest.py => exit 0, 9/9 gates passed
- ../.venv/Scripts/python.exe 고도화/sanity/test_completion_audit_matrix.py => exit 0
- ../.venv/Scripts/python.exe 고도화/sanity/test_plan_contract.py => exit 0

Limits:
- Full thread goal remains active: Nuclei/OpenVAS/Trivy/OWASP ZAP and Docker/container runtime live smokes are still pending.
