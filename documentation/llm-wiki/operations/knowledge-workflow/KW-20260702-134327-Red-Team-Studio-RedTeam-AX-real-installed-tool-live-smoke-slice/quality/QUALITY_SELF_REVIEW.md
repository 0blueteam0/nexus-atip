---
type: quality_self_review
task_id: KW-20260702-134327-Red-Team-Studio-RedTeam-AX-real-installed-tool-live-smoke-slice
project: Red-Team-Studio
task: RedTeam AX real installed tool live smoke slice
created: 2026-07-02T13:43:27+09:00
---

# Quality Self Review

| axis | score_1_to_5 | evidence | risk | action |
|---|---:|---|---|---|
| Accuracy |  |  |  |  |
| Evidence strength |  |  |  |  |
| Completeness |  |  |  |  |
| Overconfidence |  |  |  |  |
| Exaggeration |  |  |  |  |
| Bias |  |  |  |  |
| Hallucination risk |  |  |  |  |
| Falsehood risk |  |  |  |  |
| Reproducibility |  |  |  |  |
| Maintainability |  |  |  |  |
| Artifact/meta separation |  |  |  |  |
| Encoding/display |  |  |  |  |

## Overall Judgment

- verdict:
- evidence:
- residual_risk:


## Autofill Quality Evidence

Accuracy: supported by caller-provided command and artifact evidence.
Evidence strength: bounded by the artifacts listed below.
Completeness: sufficient for session handoff, not necessarily product completion.
Overconfidence: risks are explicitly retained.
Maintainability: future agents can resume from this session plus project ledgers.

Autofill timestamp: 2026-07-02T13:48:28+09:00
Project: Red-Team-Studio
Task: RedTeam AX real installed tool live smoke slice
Agent: codex
Status: ready_for_handoff
Summary: RedTeam AX installed npm live smoke slice executed npm.cmd --version through governed ToolActionCard, ExecutionPlan, token, wrapper pin, allowlist, shell=false runner, sanitizer, agent normalization, and Evidence Card creation.
Next action: Implement OpenVAS/ZAP credential vault contract or run additional installed scanner live smokes when approved tools are available.
Artifacts:
- J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/sanity/redteam_ax_installed_tool_live_smoke.py
- J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-installed-tool-live-smoke/latest_installed_tool_live_smoke.json
- J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/completion-audit/redteam_ax_completion_audit_matrix.json
- J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/FINAL_PLAN.md
- J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/Detailed_PLAN.MD
Commands:
- pytest tests/test_redteam_v2_api_router.py -q => exit 0, 49 passed
- pytest tests/test_redteam_v2_sample_e2e.py -q => exit 0, 1 passed
- redteam_ax_installed_tool_live_smoke.py => exit 0, status passed
- py_compile redteam_v2_models.py redteam_v2_api_router.py redteam_ax_installed_tool_live_smoke.py => exit 0
- test_completion_audit_matrix.py => exit 0
- test_plan_contract.py => exit 0
- test_redteam2_korean_copy_inventory.py => exit 0
Risks:
- Remaining runtime coverage is limited to npm.cmd on this host; additional scanner CLIs and Docker/container runtime need separate live smoke artifacts before full completion.
