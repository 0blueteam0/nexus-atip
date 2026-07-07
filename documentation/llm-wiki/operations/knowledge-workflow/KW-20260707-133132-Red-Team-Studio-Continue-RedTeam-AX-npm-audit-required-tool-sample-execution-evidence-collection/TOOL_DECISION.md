# Tool Decision

| need | selected method | reason | result |
|---|---|---|---|
| Prove npm audit analysis | sample package-lock workspace | Avoid scanning arbitrary project root and make cwd explicit | sample workspace added |
| Handle npm audit exit code | acceptable_exit_codes [0,1] | npm audit exits 1 when vulnerabilities are found but JSON output is valid | runner marks exit code 1 accepted |
| Restrict working directory | workspace-only directory resolver | Prevent arbitrary cwd outside project | working_dir gate added |
| Prove frontend runner path | execution-presets runner_steps | RedTeam2 button consumes structured runner steps | npm step includes working_dir |
| Prove evidence collection | governed execution + collect-results | Matches RedTeam AX case workflow | Evidence candidates and agent coverage created |
