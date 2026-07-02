# DECISIONS

- Use collection artifact `promoted_finding_ids` as the allowlist.
- Require `lead_approver` and `business_owner_approver`.
- Reject identical approvers.
- Reuse `approve_finding_severity` for each approver to preserve existing policy.
- Keep report Claim insertion out of this API and require Matrix validation next.
