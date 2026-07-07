---
type: decision_log
task_id: KW-20260707-101214-Red-Team-Studio-Continue-RedTeam-AX-batch-attest-safe-smoke-install-evidence-candidates
project: Red-Team-Studio
task: Continue RedTeam AX batch attest safe smoke install evidence candidates
created: 2026-07-07T10:12:14+09:00
---

# Decision Log

| decision | rationale | impact |
|---|---|---|
| Keep single attestation API and add batch API. | Existing clients/tests may use single endpoint. | Backward compatible expansion. |
| Batch API calls the same single-record validator. | Avoids divergent safety rules. | Candidate trust and runner unlock invariants stay consistent. |
| Frontend sends all ready candidates. | Safe smoke commonly produces several version-only outputs at once. | Faster install evidence coverage. |
| Batch still does not unlock runners. | Install evidence is not execution approval. | Maintains ROE/HITL boundary. |
