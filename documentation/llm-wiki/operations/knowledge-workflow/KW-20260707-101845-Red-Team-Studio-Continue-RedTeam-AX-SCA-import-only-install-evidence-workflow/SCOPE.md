---
type: scope
task_id: KW-20260707-101845-Red-Team-Studio-Continue-RedTeam-AX-SCA-import-only-install-evidence-workflow
project: Red-Team-Studio
task: Continue RedTeam AX SCA import-only install evidence workflow
created: 2026-07-07T10:18:45+09:00
---

# Scope

## Objective

Add a governed import-only installation evidence path for SCA/SBOM artifacts so SCA coverage can be recorded without running a scanner.

## Included

- Backend API to record SCA import-only evidence from a workspace SBOM/SCA export file.
- Registry row source flag for operator-attested import artifacts.
- RedTeam2 admin UI inputs and button for SCA/SBOM evidence recording.
- Backend regression and frontend sanity contract updates.
- Detailed and final plan updates.

## Excluded

- No SCA backend scan execution.
- No npm audit execution.
- No Finding/Claim promotion.
- No completion gate proof.
