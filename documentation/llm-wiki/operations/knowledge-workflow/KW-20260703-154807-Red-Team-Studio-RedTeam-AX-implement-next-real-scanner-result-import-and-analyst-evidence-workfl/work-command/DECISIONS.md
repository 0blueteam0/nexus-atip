# Work Command Decisions

## Accepted

- Reuse `toolchain_analyst_progress_summary` for service import projection.
- Add the summary to both the top-level import response and `toolchain_projection`.
- Show service import progress in Korean tables directly in the OpenVAS/ZAP panel.
- Keep `does_not_mark_goal_complete=true` and document residual gaps.

## Rejected

- Do not auto-run scanner commands from service import.
- Do not treat service import evidence candidates as approved Evidence.
- Do not mark the persistent goal complete.
