---
type: work_command_record
task_id: KW-20260703-145010-Red-Team-Studio-RedTeam-AX-continue-real-operating-tool-workflow-after-six-tool-work-order
project: Red-Team-Studio
task: RedTeam AX continue real operating tool workflow after six-tool work order
created: 2026-07-03T14:50:10+09:00
source_package: K:/wiki/work command
---

# HANDOFF

## Summary

RedTeam2 now separates analyst-facing execution guidance from administrator-facing analysis environment setup. A new six-tool submission template API/UI path produces collection items and attachment JSON for Nuclei, OpenVAS, Trivy, SCA, npm audit, and ZAP without executing the tools.

## Files To Read

- `projects/ai-agentic-soc/runtime/redteam_v2_models.py`
- `projects/ai-agentic-soc/runtime/redteam_v2_api_router.py`
- `projects/ai-agentic-soc/soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js`
- `projects/ai-agentic-soc/Red Team Studio/FINAL_PLAN.md`
- `projects/ai-agentic-soc/Red Team Studio/Detailed_PLAN.MD`
- `projects/ai-agentic-soc/Red Team Studio/고도화/llm-wiki/LLM_WIKI_HOME.md`

## Continue From

Run real operator evidence collection outside the webapp, fill artifact paths using the RedTeam2 submission template, then use the manifest draft and validator pipeline.

## Verification

All local syntax, API tests, frontend contract tests, and audit sanity checks passed. Product goal remains blocked pending real evidence.
