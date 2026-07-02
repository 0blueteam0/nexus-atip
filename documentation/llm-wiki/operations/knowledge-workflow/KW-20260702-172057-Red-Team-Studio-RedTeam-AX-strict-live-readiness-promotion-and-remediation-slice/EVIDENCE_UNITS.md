---
type: evidence_unit
status: updated
id: KW-20260702-172057-EU-PROMOTION
project: Red Team Studio
created: 2026-07-02T17:20:57+09:00
---

# Evidence Units

## EU-001 Strict Promotion Artifact

- claim: strict live readiness is currently blocked and rollup evidence exists
- source_type: command_artifact
- path_or_url: `J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-strict-live-readiness-promotion/latest_strict_live_readiness_promotion.json`
- command: `.venv/Scripts/python.exe "Red Team Studio/고도화/sanity/redteam_ax_strict_live_readiness_promotion.py"`
- exit_code: 0
- evidence: artifact status is `blocked_strict_live_readiness_promotion`, 0 passed, 4 failed
- limits: default mode does not run real container or network import

## EU-002 Accepted Gates

- claim: current regression suite passes with strict promotion artifact gate included
- source_type: accepted_gate_manifest
- path_or_url: `J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-accepted-gates/latest_accepted_gate_manifest.json`
- command: `.venv/Scripts/python.exe "Red Team Studio/고도화/sanity/redteam_ax_accepted_gate_manifest.py"`
- exit_code: 0
- evidence: 18 accepted gates, 18 passed, 0 failed
- limits: accepted gates do not claim strict live promotion success
