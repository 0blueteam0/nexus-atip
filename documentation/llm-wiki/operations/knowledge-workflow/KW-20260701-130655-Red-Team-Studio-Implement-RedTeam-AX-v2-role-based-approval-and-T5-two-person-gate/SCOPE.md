---
type: scope
task_id: KW-20260701-130655-Red-Team-Studio-Implement-RedTeam-AX-v2-role-based-approval-and-T5-two-person-gate
project: Red Team Studio
task: Implement RedTeam AX v2 role based approval and T5 two person gate
created: 2026-07-01T13:06:55+09:00
enforcement_level: L2-or-higher
---

# Scope

## User Intent

Describe the user's request as an operational task.

## Included

- 

## Excluded

- Only explicitly excluded items belong here. Default is include.

## Work Units

| unit | description | expected_artifact |
|---|---|---|
|  |  |  |

## Required Artifacts

| artifact | path | purpose |
|---|---|---|
|  |  |  |

## Verification Criteria

| criterion | evidence_required |
|---|---|
| Scope declared | `SCOPE.md` |
| Evidence recorded | `EVIDENCE_UNITS.md` |
| Gate closed | `QUALITY_GATE_RESULT.json` |

## Completion Definition

The task is complete only when scope, artifacts, evidence, decisions, handoff, and gate result exist.

## Codex Scope Addendum

User intent: RedTeam AX v2의 고위험 ToolAction 승인이 역할 기반으로 검증되어야 하며, T5 또는 controlled production 실행은 서로 다른 두 승인자가 모두 승인하기 전까지 수동 수행도 진행되지 않아야 한다.

Included:

- `approver_role` allow-list와 역할 정규화.
- T3/T4/T5별 required approver role 정책.
- T4 unauthorized role invalid 처리.
- T5 two-person distinct approver hard gate.
- `Approved` 전 고위험 manual-run 차단.
- ActionCard 없는 manual-run 차단.
- UI Queue에 approval mode와 required approver roles 표시.
- API/sample/live/browser smoke 검증.

Excluded:

- 실제 로그인 provider와 approver identity binding.
- approved report export API.
- tool output import/normalizer API.

Work units:

| unit | description | expected_artifact |
|---|---|---|
| Policy | approver role normalization and approval policy | `runtime/redteam_v2_models.py` |
| Gate | T5 partial approval and manual-run blocking | `runtime/redteam_v2_models.py` |
| UI | required approver role display | `reports.js` |
| Tests | role/T5/manual-run gate coverage | `tests/test_redteam_v2_api_router.py`, `tests/test_redteam_v2_sample_e2e.py` |
| Live Evidence | T5 two-person smoke and UI role screenshot | `archive/runs/redteam-ax-v2/CASE-LIVE-T5-TWO-PERSON-001`, `고도화/live-smoke/redteam2-approval-roles-ui-smoke.png` |
