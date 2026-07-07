# Handoff

This slice records safe smoke install evidence candidates after operator review.

Key files:

- `runtime/redteam_v2_models.py`: new `attest_safe_smoke_install_version_evidence_candidate`.
- `runtime/redteam_v2_api_router.py`: new POST route.
- `tests/test_redteam_v2_api_router.py`: regression covering API-executed candidate attestation without runner unlock.
- `reports.js`: RedTeam2 `attestRedTeam2SafeSmokeInstallCandidate` and admin button.
- `Detailed_PLAN.MD` section 96 and `FINAL_PLAN.md` section 149.

Next work should add per-candidate selection and then continue toward real six-tool result collection, LLM agent analysis, Evidence approval, Finding promotion, Matrix/Report/export, and completion gate proof.
