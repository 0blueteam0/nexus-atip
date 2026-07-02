---
type: evidence_unit
status: draft
id:
project: Red-Team-Studio
created: 2026-07-02T15:33:16+09:00
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

Claim: RedTeam AX OpenVAS/ZAP CLI wrapper live smoke slice: isolated gvm-tools and zapcli in tools/redteam-ax venv, generated hash-pinned .cmd shims, fixed Windows runner allowlist to accept manifest availability.path case-insensitively, ran OpenVAS gvm-cli and ZAP CLI through ToolActionCard, dry-run ExecutionPlan, execution token, shell=false governed runner, sanitizer, agent normalization, and Evidence Card creation. Accepted gate manifest now passes 11/11. Remaining gaps are Docker/container runtime and actual OpenVAS/ZAP service endpoint import smokes.

Source:
- source_type: local_session
- path_or_url: J:\PortableApps\genai\documentation\llm-wiki\operations\knowledge-workflow\KW-20260702-153316-Red-Team-Studio-RedTeam-AX-OpenVAS-and-ZAP-CLI-wrapper-live-smoke-slice
- command: knowledge_workflow.py autofill
- exit_code: pending_until_close
- collected_at: 2026-07-02T15:50:55+09:00

Evidence artifacts:
- J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/sanity/redteam_ax_openvas_zap_cli_live_smoke.py
- J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-openvas-zap-cli-live-smoke/latest_openvas_zap_cli_live_smoke.json
- J:/PortableApps/genai/projects/ai-agentic-soc/runtime/redteam_v2_models.py
- J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-accepted-gates/latest_accepted_gate_manifest.json

Command evidence:
- ../.venv/Scripts/python.exe 고도화/sanity/redteam_ax_openvas_zap_cli_live_smoke.py => exit 0, OpenVAS/ZAP CLI passed
- ../.venv/Scripts/python.exe 고도화/sanity/redteam_ax_accepted_gate_manifest.py => exit 0, 11/11 gates passed
- ../.venv/Scripts/python.exe 고도화/sanity/test_completion_audit_matrix.py => exit 0
- ../.venv/Scripts/python.exe 고도화/sanity/test_plan_contract.py => exit 0

Limits:
- Actual OpenVAS service report import, ZAP daemon passive-alert import, and Docker/container runtime remain unproven.


## Autofill Evidence Unit

Claim: RedTeam AX OpenVAS/ZAP CLI wrapper live smoke slice: isolated gvm-tools and zapcli in tools/redteam-ax venv, generated hash-pinned .cmd shims, fixed Windows runner allowlist to accept manifest availability.path case-insensitively, ran OpenVAS gvm-cli and ZAP CLI through ToolActionCard, dry-run ExecutionPlan, execution token, shell=false governed runner, sanitizer, agent normalization, and Evidence Card creation. Accepted gate manifest now passes 11/11. Remaining missing evidence fields are Docker/container runtime artifact status pass and OpenVAS/ZAP service endpoint import artifacts.

Source:
- source_type: local_session
- path_or_url: J:\PortableApps\genai\documentation\llm-wiki\operations\knowledge-workflow\KW-20260702-153316-Red-Team-Studio-RedTeam-AX-OpenVAS-and-ZAP-CLI-wrapper-live-smoke-slice
- command: knowledge_workflow.py autofill
- exit_code: pending_until_close
- collected_at: 2026-07-02T15:51:28+09:00

Evidence artifacts:
- J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/sanity/redteam_ax_openvas_zap_cli_live_smoke.py
- J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-openvas-zap-cli-live-smoke/latest_openvas_zap_cli_live_smoke.json
- J:/PortableApps/genai/projects/ai-agentic-soc/runtime/redteam_v2_models.py
- J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-accepted-gates/latest_accepted_gate_manifest.json

Command evidence:
- ../.venv/Scripts/python.exe 고도화/sanity/redteam_ax_openvas_zap_cli_live_smoke.py => exit 0, OpenVAS/ZAP CLI passed
- ../.venv/Scripts/python.exe 고도화/sanity/redteam_ax_accepted_gate_manifest.py => exit 0, 11/11 gates passed
- ../.venv/Scripts/python.exe 고도화/sanity/test_completion_audit_matrix.py => exit 0
- ../.venv/Scripts/python.exe 고도화/sanity/test_plan_contract.py => exit 0

Limits:
- Missing evidence fields for final completion: Docker/container runtime smoke artifact status pass, OpenVAS service report import artifact, and ZAP daemon passive-alert import artifact.
