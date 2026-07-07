# Decisions

- Safe smoke version-only stdout is exposed as an installation evidence candidate, not as attested evidence.
- Candidate rows carry `commands_executed_by_api=true` for transparency.
- Candidate rows keep `trusted_as_instruction=false`, `requires_operator_attestation=true`, and `runner_unlocks=[]`.
- RedTeam2 displays candidate hash and next action, not raw local artifact paths.
- SCA remains import-only and is still handled through `결과 첨부 필요 도구`.
- Full completion remains blocked until real six-tool results, Evidence approval, Finding approval, Matrix/Report/export, sample E2E, and regression gates pass.
