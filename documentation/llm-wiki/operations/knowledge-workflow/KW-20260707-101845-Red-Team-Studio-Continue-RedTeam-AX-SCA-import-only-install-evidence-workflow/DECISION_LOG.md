---
type: decision_log
task_id: KW-20260707-101845-Red-Team-Studio-Continue-RedTeam-AX-SCA-import-only-install-evidence-workflow
project: Red-Team-Studio
task: Continue RedTeam AX SCA import-only install evidence workflow
created: 2026-07-07T10:18:45+09:00
---

# Decision Log

| decision | rationale | impact |
|---|---|---|
| Add SCA-specific import evidence API. | SCA is import-only and should not be forced into version-only CLI semantics. | Clearer evidence provenance. |
| Require workspace-local artifact path. | Prevents arbitrary external path references and enables hashing. | Stronger evidence traceability. |
| Require human validation summary and attestation. | Avoids evidence-less registry records. | Preserves HITL. |
| Frontend action remains admin/operations scoped. | SCA evidence recording is an operator review action. | Keeps beginner default workflow simple. |
