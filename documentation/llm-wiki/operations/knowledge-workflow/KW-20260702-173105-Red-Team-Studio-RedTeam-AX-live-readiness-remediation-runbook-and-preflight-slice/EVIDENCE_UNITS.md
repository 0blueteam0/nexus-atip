---
type: evidence_unit
status: updated
id: KW-20260702-173105-EU-RUNBOOK
project: Red Team Studio
created: 2026-07-02T17:31:05+09:00
---

# Evidence Units

## EU-001 Remediation Runbook

- claim: current strict promotion blockers are converted into operator remediation steps
- source_type: command_artifact
- path_or_url: `J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-live-readiness-remediation/latest_live_readiness_remediation_runbook.json`
- command: `.venv/Scripts/python.exe "Red Team Studio/고도화/sanity/redteam_ax_live_readiness_remediation_runbook.py"`
- exit_code: 0
- evidence: status `ready_for_operator_remediation`, blocked_step_count `5`
- limit: not a repair or completion proof

## EU-002 Accepted Gates

- claim: accepted gate suite includes the remediation runbook gate and passes
- source_type: accepted_gate_manifest
- path_or_url: `J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-accepted-gates/latest_accepted_gate_manifest.json`
- command: `.venv/Scripts/python.exe "Red Team Studio/고도화/sanity/redteam_ax_accepted_gate_manifest.py"`
- exit_code: 0
- evidence: 19 accepted gates, 19 passed, 0 failed
