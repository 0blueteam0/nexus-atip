# Handoff

The current slice connects safe local smoke version-only execution output to UI-visible install evidence candidates.

Read next:

- `runtime/redteam_v2_models.py` for `safe_smoke_install_version_evidence_candidates`.
- `reports.js` for `installEvidenceCandidateRows` and the `설치 확인 결과 후보` table.
- `tests/test_redteam_v2_api_router.py` for mocked high-risk safe smoke regression.
- `Red Team Studio/Detailed_PLAN.MD` section 95.
- `Red Team Studio/FINAL_PLAN.md` section 148.

Next implementation should add a human attestation endpoint/import action that records a selected candidate into the install evidence registry without unlocking scanner execution.
