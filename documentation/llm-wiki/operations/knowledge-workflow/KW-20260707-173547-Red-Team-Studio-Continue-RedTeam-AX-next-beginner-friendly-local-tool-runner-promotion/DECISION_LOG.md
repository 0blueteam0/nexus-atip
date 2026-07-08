# Decision Log

- Decision: Add detect-secrets as optional runner coverage.
  Evidence: TOOL-DETECT-SECRETS-001 uses required_for_core_coverage=false and optional_runner_profile=true.
  verified_at: 2026-07-07

- Decision: Use clean sample workspace and redacted parser fixture instead of realistic secrets.
  Evidence: sample workspace contains only README and app_config.example with placeholder_value=not-a-secret.
  verified_at: 2026-07-07

- Decision: Keep audit and baseline mutation out of the frontend button path.
  Evidence: profile prohibited_options include audit and --baseline.
  verified_at: 2026-07-07
