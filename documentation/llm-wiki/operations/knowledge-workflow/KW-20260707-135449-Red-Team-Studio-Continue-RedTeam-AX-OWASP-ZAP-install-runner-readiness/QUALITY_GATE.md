# Quality Gate

| gate | status | evidence |
|---|---|---|
| official source used | pass | OWASP ZAP release v2.17.0 |
| hash verification | pass | zip and launcher sha256 recorded |
| no active scan | pass | only zap.bat -version executed |
| runtime trust | pass | manifest hash_match, trusted_for_runner true |
| governed safe smoke | pass | CASE-V2-ZAP-PORTABLE-SMOKE-caec0405 executed_count=2 blocker_count=0 |
| tests | pass | targeted unittest OK |
| frontend sanity | pass | runtime and launch contracts OK |
| full goal completion | incomplete | org ZAP endpoint/import and final gates remain |

Gate result: pass for this ZAP installation slice. Full RedTeam AX goal is not complete.
