# Decision Log

- Decision: Add Bandit as optional runner coverage.
  Evidence: TOOL-BANDIT-001 uses required_for_core_coverage=false and optional_runner_profile=true.
  verified_at: 2026-07-08

- Decision: Keep the composite execution step limit at 6.
  Evidence: governed_toolchain_execution rejects more than six steps with too_many_tool_steps_requested; regression now separates full catalog readiness from execution subset.
  verified_at: 2026-07-08

- Decision: Use a benign helper script sample instead of risky generated script content.
  Evidence: bandit_workspace/safe_helper.py has no network, credential, destructive, or exploit behavior.
  verified_at: 2026-07-08
