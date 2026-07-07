---
type: decision_log
task_id: KW-20260707-100314-Red-Team-Studio-Continue-RedTeam-AX-safe-smoke-candidate-operator-attestation-to-install-evidenc
project: Red-Team-Studio
task: Continue RedTeam AX safe smoke candidate operator attestation to install evidence registry
created: 2026-07-07T10:03:14+09:00
---

# Decision Log

| decision | rationale | impact |
|---|---|---|
| Add a separate safe smoke candidate attestation API. | Existing version evidence API means operator-executed command; safe smoke candidates are API-executed and must not be mislabeled. | Preserves audit truth. |
| Reuse install evidence artifact kind with source flags. | The registry should show both operator-entered and operator-attested candidate records in one coverage view. | Improves UX without splitting the evidence coverage table. |
| Keep `runner_unlocks=[]`. | Installation evidence does not authorize analysis execution. | Maintains ROE/HITL boundary. |
| Add admin-only UI button. | Recording evidence is a review/attestation action, not a default analyst action. | Keeps beginner UX simple and controlled. |
