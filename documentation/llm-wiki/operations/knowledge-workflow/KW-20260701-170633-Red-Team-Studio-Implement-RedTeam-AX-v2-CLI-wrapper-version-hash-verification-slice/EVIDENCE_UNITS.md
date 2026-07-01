---
type: evidence_unit
status: draft
id:
project: Red-Team-Studio
created: 2026-07-01T17:06:33+09:00
---

# Evidence Unit

## Claim

RedTeam AX v2 now exposes safe CLI/API wrapper manifest and hash preflight state for registered analysis tools.

## Source

- source_type: local_code
- path_or_url: `J:/PortableApps/genai/projects/ai-agentic-soc/runtime/redteam_v2_models.py`
- command: `git diff -- runtime/redteam_v2_models.py runtime/redteam_v2_api_router.py tests/test_redteam_v2_api_router.py soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js "Red Team Studio/FINAL_PLAN.md"`
- exit_code: 0
- collected_at: 2026-07-01T17:40:00+09:00

## Evidence

- Added manifest functions that compute command availability, resolved path, actual SHA-256, expected SHA-256, pinning status, runner trust, and version probe mode without executing tool commands.
- Added `/api/redteam/v2/tool-wrapper-manifests` and `/api/redteam/v2/tool-wrapper-manifests/{tool_id}`.
- `analysis-tools` now includes `wrapper_manifest` and `pinning_status`.
- `ToolExecutionPlan` now includes `wrapper_manifest`, `wrapper_preflight`, and `wrapper_sha256_pin_required_before_runner_execution` warning when runner trust requires a pin.

## Confidence

High for registry/API/UI foundation. Runtime availability values are environment-dependent by design.

## Limits

- Version command evidence is not collected.
- Expected SHA-256 pins are not yet user-configurable.
- Actual runner hard-blocking is not implemented yet.

## Related Decisions

- Decision: registry read APIs must not execute scanner/version commands.
- Decision: import-only SCA profile is trusted without wrapper pinning.
- Decision: CLI/API wrappers require hash pin before runner trust.

