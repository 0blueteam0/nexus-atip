---
type: decision_log
task_id: KW-20260702-223200-Red-Team-Studio-RedTeam-AX-finding-claim-candidate-promotion-API-slice
project: Red Team Studio
task: RedTeam AX finding claim candidate promotion API slice
created: 2026-07-02T22:32:00+09:00
---

# Decision Log

## DEC-001 Candidate promotion API 추가

- decision: `/api/redteam/v2/tool-result-finding-claim-review/{candidate_id}/promote-finding`를 추가한다.
- rationale: 후보 패키지와 기존 Finding 생성 API 사이에 HITL safety gate가 필요하다.
- evidence: `test_tool_result_candidate_promotion_blocks_unapproved_evidence`, `test_tool_result_candidate_promotion_creates_finding_after_evidence_approval`.

## DEC-002 Evidence store approval을 promotion 기준으로 사용

- decision: review package snapshot이 stale이어도 backend Evidence store에서 승인/검증된 Evidence면 promotion을 허용한다.
- rationale: 최신 권위 상태는 artifact snapshot보다 mutable backend Evidence record다.
- guardrail: evidence issue가 하나라도 있으면 blocked로 반환하고 Finding을 만들지 않는다.

## DEC-003 보고서 Claim 삽입 금지 유지

- decision: promotion API는 Finding 초안만 만들고 `report_claim_inserted=false`를 유지한다.
- rationale: Claim-Evidence Matrix와 report validation은 severity 2인 승인 이후 별도 단계로 남겨야 unsupported claim을 막을 수 있다.

| time | decision | alternatives | reason | evidence |
|---|---|---|---|---|
|  |  |  |  |  |
