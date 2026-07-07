---
type: scope
task_id: KW-20260707-133132-Red-Team-Studio-Continue-RedTeam-AX-npm-audit-required-tool-sample-execution-evidence-collection
project: Red Team Studio
task: Continue RedTeam AX npm audit required tool sample execution evidence collection readiness
created: 2026-07-07T13:31:32+09:00
enforcement_level: L2-or-higher
---

# Scope

## User Intent

Advance the active RedTeam AX objective by proving npm audit, a required analysis tool, can execute against an approved lockfile workspace through the governed runner and collect results into Evidence/LLM analysis coverage.

## Included

- Confirm npm.cmd wrapper trust/readiness.
- Add npm audit sample workspace with package.json and package-lock.json.
- Add safe runner working_dir support restricted to workspace directories.
- Treat npm audit exit code 1 as accepted because it means vulnerabilities were found while JSON output was produced.
- Execute npm audit sample manually and via governed npm audit + Sigma toolchain.
- Update tests and planning documents.

## Excluded

- No npm fix, publish, package mutation, credentialed registry access, or production workspace scan.
- Do not claim full six-tool completion.

## Verification Criteria

| criterion | evidence_required |
|---|---|
| npm wrapper trusted | manifest hash_match evidence |
| sample audit runs | npm audit JSON command output with exit code 1 |
| exit code 1 accepted | governed runner attempt exit_code_policy accepted |
| result collected | collect-results Evidence candidate and agent coverage |
| tests pass | compile, pytest, frontend sanity, node check |
| gate closed | QUALITY_GATE_RESULT.json |
