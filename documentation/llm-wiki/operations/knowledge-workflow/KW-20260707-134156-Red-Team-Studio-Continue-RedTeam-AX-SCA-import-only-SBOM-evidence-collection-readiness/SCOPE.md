---
title: RedTeam AX SCA import-only SBOM sample evidence readiness
project: Red Team Studio
task_id: KW-20260707-134156-Red-Team-Studio-Continue-RedTeam-AX-SCA-import-only-SBOM-evidence-collection-readiness
created_at: 2026-07-07T13:41:56+09:00
updated_at: 2026-07-07T13:50:38+09:00
status: active
---

# Scope

## Objective
Add a reproducible SCA/CycloneDX import-only sample path so RedTeam2 결과 첨부 guidance can point to a real SBOM fixture and the existing SCA normalizer can be regression-tested against that fixture.

## Included
-
untime/redteam_v2_models.py SCA preset/import guidance sample path fields.
- Red Team Studio/고도화/samples/sca_cyclonedx/redteam_ax_sample_sbom.cdx.json sample CycloneDX SBOM.
- 	ests/test_redteam_v2_api_router.py regression updates.
- Detailed_PLAN.MD and FINAL_PLAN.md plan updates.

## Excluded
- No SCA scanner execution.
- No npm fix, package publish, credentialed registry action, active scan, or remote service scan.
- No Finding/Claim/Report/export/completion gate closure claim.
