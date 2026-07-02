---
type: handoff
project: Red Team Studio
task: RedTeam AX operator evidence submission validator slice
---

# Handoff

Added operator evidence submission validation. The next operator should create a submission manifest from `latest_operator_evidence_collection_package.json`, fill artifact paths and SHA-256 values, mark only reviewed items as `approved`, then run:

```powershell
.\.venv\Scripts\python.exe "Red Team Studio\고도화\sanity\redteam_ax_operator_evidence_submission_validator.py" --submission-manifest <path> --require-approved
```

Current accepted gate: 21/21 passed. Current validation status: `awaiting_operator_evidence_submission`.
