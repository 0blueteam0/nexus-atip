---
type: scope
task_id: KW-20260702-174256-Red-Team-Studio-RedTeam-AX-next-completion-blocker-reduction-slice
project: Red Team Studio
task: RedTeam AX next completion blocker reduction slice
created: 2026-07-02T17:42:56+09:00
enforcement_level: L2-or-higher
---

# Scope

## User Intent

Continue the active RedTeam AX goal without narrowing the final success definition. This slice improves the Korean beginner-facing runtime readiness UI so the live readiness remediation runbook is actionable from the RedTeam2 panel.

## Included

- Add `운영자 조치 runbook 단계` table to RedTeam2 runtime readiness panel.
- Show remediation step title, status, owner, blockers, and verification command from `live_readiness_remediation.steps`.
- Add fallback operator step order when the artifact is not loaded.
- Translate `platform_operator` as `플랫폼 운영자`.
- Update frontend runtime readiness contract and Korean copy inventory.
- Update FINAL_PLAN, Detailed_PLAN, LLM Wiki, and completion audit records.

## Excluded

- Starting Docker Desktop, WSL, OpenVAS, or ZAP.
- Creating endpoint or vault credentials.
- Running active scans or mutating scanner APIs.
- Marking the full thread goal complete.

## Work Units

| unit | description | expected_artifact |
|---|---|---|
| UI | Render operator remediation step table | `reports.js` |
| Contract | Assert Korean runbook step anchors | `redteam_ax_frontend_runtime_readiness_contract.py` |
| Copy inventory | Assert visible Korean copy anchors | `test_redteam2_korean_copy_inventory.py` and inventory JSON |
| Docs | Record Slice 71 and audit proof update | FINAL_PLAN, Detailed_PLAN, LLM Wiki, completion audit |
| Verification | Run targeted tests and accepted gate | accepted gate JSON artifact |

## Verification Criteria

| criterion | evidence_required |
|---|---|
| JS syntax valid | `node --check reports.js` exit_code 0 |
| Runtime readiness contract valid | `redteam_ax_frontend_runtime_readiness_contract.py` exit_code 0 |
| Korean copy valid | `test_redteam2_korean_copy_inventory.py` exit_code 0 |
| Plans and audit valid | plan and completion audit sanity exit_code 0 |
| Regression valid | accepted gate manifest 19/19 passed |

## Completion Definition

This slice is complete when the UI visibility change, contracts, docs, audit notes, and accepted gate are committed and pushed. The full RedTeam AX goal remains incomplete until live readiness promotion blockers are actually cleared.
