# Tool Decision

Gitleaks v8.30.1 is selected as the next optional RedTeam AX tool because it is a low-risk local secret exposure scanner that can run against an approved workspace without network target interaction.

Runner policy:
- Allowed: `gitleaks detect --no-git --source . --report-format json --report-path - --redact --no-banner --log-level error --exit-code 0` in the approved sample workspace.
- Denied: `--pipe`, `--diagnostics`, `--log-opts`, `--follow-symlinks`, arbitrary or unapproved source paths.
- Secret values are not stored. Output is untrusted data and requires human validation.
