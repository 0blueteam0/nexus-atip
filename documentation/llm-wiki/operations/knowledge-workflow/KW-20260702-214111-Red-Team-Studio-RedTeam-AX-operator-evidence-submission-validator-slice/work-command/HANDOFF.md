# Handoff

Submission validation is implemented. Continue by preparing real approved evidence:

1. Run Docker/WSL/OpenVAS/ZAP readiness commands in a controlled environment.
2. Fill a submission manifest from the package template.
3. Include artifact path and SHA-256 for each `OEC-*` item.
4. Set `review_status` to `approved` only after human review.
5. Run:

```powershell
.\.venv\Scripts\python.exe "Red Team Studio\고도화\sanity\redteam_ax_operator_evidence_submission_validator.py" --submission-manifest <path> --require-approved
```

Current gate: 21/21 passed. Current status: `awaiting_operator_evidence_submission`.
