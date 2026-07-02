# Decision Log

| decision | rationale | evidence |
|---|---|---|
| Batch approve collection Evidence candidates | Users need a clear next step after result collection | RedTeam2 UI and API regression |
| Reuse `approve_evidence_card` | Keeps actor/reviewer identity binding consistent | Approval test expects `identity_binding=bound` |
| Do not create Findings in approval API | Finding creation has separate review and severity gates | API returns `finding_created=false` |
