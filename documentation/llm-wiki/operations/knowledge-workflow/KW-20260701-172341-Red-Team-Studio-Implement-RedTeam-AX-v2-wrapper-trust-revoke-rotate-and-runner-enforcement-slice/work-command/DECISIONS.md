---
type: work_command_record
task_id: KW-20260701-172341-Red-Team-Studio-Implement-RedTeam-AX-v2-wrapper-trust-revoke-rotate-and-runner-enforcement-slice
project: Red-Team-Studio
task: Implement RedTeam AX v2 wrapper trust revoke rotate and runner enforcement slice
created: 2026-07-01T17:23:42+09:00
source_package: K:/wiki/work command
---

# DECISIONS

## Ledger

| id | decision | alternatives | reason | impact |
|---|---|---|---|---|
| D1 | Revoked pins are excluded by `load_approved_tool_wrapper_pin`. | Keep revoked pin visible and let callers filter. | Central filtering prevents stale trust from leaking into manifests or execution preflight. | Wrapper manifest and execution plan consume the same active-trust contract. |
| D2 | Rotation is modeled as a new request plus approval, with an explicit warning when an approved pin already exists. | Add a separate rotate endpoint. | The existing request/approve contract already captures reviewer identity, request artifact, and hash details. | Fewer API surfaces while preserving audit evidence for replacement trust decisions. |
| D3 | Wrapper-backed runners receive a blocked execution token when preflight trust is missing. | Return warnings only and let operators decide later. | RedTeam AX requires no unapproved high-risk/tool execution path; a warning-only path could be bypassed by clients. | API consumers see `preflight_blocked`, `deny_runner`, and `execution_token.status=blocked`. |
| D4 | UI revocation is exposed beside request/approve pin actions in RedTeam2. | Hide revocation behind a separate admin screen. | Operators reviewing wrapper manifests need immediate trust removal in the same evidence context. | Report Studio can remove active trust without leaving the manifest panel. |

## Entries
- D1 implemented in `runtime/redteam_v2_models.py` by making approved-pin lookup ignore records with `revoked=true` or non-`approved` status.
- D2 implemented by adding `existing_approved_pin` and `existing_approved_pin_will_be_rotated_on_approval` warning to pin request output.
- D3 implemented in `build_tool_execution_plan` by setting `status=preflight_blocked`, `policy_decision.decision=deny_runner`, and `execution_token.status=blocked` when wrapper preflight fails before runner execution.
- D4 implemented in `reports.js` by adding `revokeRedTeam2WrapperPin`, Revoke Pin button state, and manifest panel row feedback.

