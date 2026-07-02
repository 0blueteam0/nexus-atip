# Decisions

1. Import plan does not call `/api/redteam/v2/evidence`; it only emits candidate payloads.
2. Candidate payloads are generated only from submission validation items with no errors, `approved=true`, `sha256_match=true`, and `status_match=true`.
3. Candidate payloads remain `approval_status=pending_review`; a human must approve Evidence Cards later.
4. Runtime readiness treats missing candidates as a blocker so the UI cannot imply evidence exists.
5. Completion audit remains active incomplete because no approved operator evidence or created Evidence Cards exist yet.
