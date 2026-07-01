---
type: evidence_unit
status: draft
id:
project: Red-Team-Studio
created: 2026-07-01T17:16:53+09:00
---

# Evidence Unit

## Claim

RedTeam AX v2 now supports auditable expected SHA-256 wrapper pin request and approval, and approved pins feed back into wrapper manifests.

## Source

- source_type: local_code_and_tests
- path_or_url: `J:/PortableApps/genai/projects/ai-agentic-soc/runtime/redteam_v2_models.py`
- command: bundled Python unittest, Node syntax check, Vite build, plan sanity
- exit_code: 0
- collected_at: 2026-07-01T17:30:00+09:00

## Evidence

- `/tool-wrapper-pins/{tool_id}/request` stores expected SHA-256 and operator-attested version evidence.
- `/tool-wrapper-pins/{tool_id}/approve` enforces actor binding and `red_team_lead` approval.
- Approved pins are stored as `tool-wrapper-pins` artifacts and manifest response shows `expected_sha256_source=approved_pin`.
- API regression includes unauthorized approval rejection and import-only pin request rejection.

## Confidence

High for workflow foundation and API/UI behavior under local tests.

## Limits

- Real scanner version commands are not executed by the registry.
- Pin revoke/rotate and actual runner hard-block enforcement remain open.

## Related Decisions

- Do not execute version commands in registry APIs.
- Use `red_team_lead` as first pin approver role.

