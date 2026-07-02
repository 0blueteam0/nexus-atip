# Scope

- project: Red-Team-Studio
- task: RedTeam AX operating scanner close-e2e preflight and evidence record slice
- slice: 91
- status: implemented, verifying

## Objective

Add a beginner-friendly, non-executing operating scanner artifact submit-and-close path.

The path must accept existing operator scanner output files, build or validate a manifest, import artifacts by `source_path` and `sha256`, collect Evidence candidates, run the explicit-approver close-e2e lane, export Korean Report v2, and record completion gate status without running scanners, Docker, WSL, shell expansion, active scans, or network probes.

## In Scope

- Backend API: `/api/redteam/v2/toolchains/close-operating-artifact-manifest-e2e`
- RedTeam2 Korean UI: operating source folder input and submit-and-close button
- Regression test for six-tool operating fixture files
- Sanity anchors for frontend runtime readiness and Korean copy inventory
- Completion audit, Detailed_PLAN, FINAL_PLAN, and LLM Wiki updates
- Accepted gate manifest regeneration

## Out of Scope

- Running real organization OpenVAS/ZAP endpoints
- Running scanner binaries, Docker containers, WSL commands, or network scans
- Marking the full thread goal complete
- Claiming that controlled fixtures prove real organization operating evidence
