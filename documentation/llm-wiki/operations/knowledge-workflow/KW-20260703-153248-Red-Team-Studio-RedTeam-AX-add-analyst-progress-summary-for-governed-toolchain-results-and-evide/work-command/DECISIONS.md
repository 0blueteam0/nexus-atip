# Work Command Decisions

## Accepted

- Put the progress summary in the backend API instead of deriving it only in the browser.
- Reuse the same summary shape for run-status and collect-results so analysts can follow one workflow vocabulary.
- Expose Korean button labels directly in the response because the RedTeam2 workflow is Korean-first.
- Preserve `does_not_mark_goal_complete=true` because the summary is not Evidence approval or Report completion.
- Treat audit matrix RTA-COMP-070 as proved only for the progress-summary requirement, with residual gaps called out.

## Rejected

- Do not auto-approve Evidence candidates after collection.
- Do not change final completion behavior.
- Do not run active scanners in this UX/API projection slice.
