---
type: scope
task_id: KW-20260702-232213-Red-Team-Studio-RedTeam-AX-collection-evidence-approval-to-matrix-continuation-slice
project: Red Team Studio
task: RedTeam AX collection evidence approval to matrix continuation slice
created: 2026-07-02T23:22:13+09:00
enforcement_level: L2-or-higher
---

# Scope

## User Intent

RedTeam AX에서 복합 도구 실행 결과 회수 후 Evidence 후보가 승인돼야 Finding, Claim-Evidence Matrix, Report v2로 이동할 수 있다. 이번 slice는 toolchain collection Evidence 후보를 HITL batch approval로 승인하는 backend/API/UI/test/docs 경로를 추가한다.

## Included

- `POST /api/redteam/v2/toolchain-result-collections/{collection_id}/approve-evidence`
- RedTeam2 Korean UI approval button and result table
- API regression for collection Evidence approval
- Plan, LLM Wiki, completion audit updates

## Excluded

- Finding promotion and two-person severity approval automation
- Final Report v2 export approval
- Any unauthorized active scanner execution

## Verification Criteria

| criterion | evidence_required |
|---|---|
| API regression | `pytest tests/test_redteam_v2_api_router.py -q` exits 0 |
| Frontend contracts | JS check, runtime readiness contract, Korean copy inventory pass |
| Accepted gates | `redteam_ax_accepted_gate_manifest.py` 24/24 passed |
| KW gate | `QUALITY_GATE_RESULT.json` status OK |
