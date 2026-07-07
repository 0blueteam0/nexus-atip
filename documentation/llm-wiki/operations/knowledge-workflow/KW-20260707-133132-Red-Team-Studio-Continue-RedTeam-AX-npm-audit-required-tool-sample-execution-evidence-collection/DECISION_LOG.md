# Decision Log

| decision | rationale | consequence |
|---|---|---|
| Add sample npm audit workspace | Need deterministic approved lockfile input | sample package.json/package-lock.json committed |
| Add runner working_dir | npm audit must run where package-lock exists | runner cwd can be set for workspace directories only |
| Accept npm audit exit code 1 | npm uses 1 to signal vulnerabilities found | findings JSON is collected instead of marking execution failed |
| Keep npm fix/publish prohibited | User goal is analysis/evidence, not mutation | no mutating npm commands allowed |
