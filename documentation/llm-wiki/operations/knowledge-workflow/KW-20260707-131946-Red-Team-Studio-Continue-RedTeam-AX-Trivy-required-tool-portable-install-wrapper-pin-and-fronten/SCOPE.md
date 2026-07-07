---
type: scope
task_id: KW-20260707-131946-Red-Team-Studio-Continue-RedTeam-AX-Trivy-required-tool-portable-install-wrapper-pin-and-fronten
project: Red Team Studio
task: Continue RedTeam AX Trivy required tool portable install wrapper pin and frontend runner readiness
created: 2026-07-07T13:19:46+09:00
enforcement_level: L2-or-higher
---

# Scope

## User Intent

Continue the active RedTeam AX goal by installing another required red-team analysis tool, connecting it to governed frontend runner readiness, and proving result collection into Evidence/LLM analysis coverage.

## Included

- Verify official Trivy install source and avoid the known compromised Trivy v0.69.4 release.
- Install Trivy v0.72.0 Windows 64bit binary into project-local portable tools.
- Pin Trivy wrapper SHA-256 in `TOOL-TRIVY-001`.
- Update Trivy execution preset to use the installed portable binary.
- Add a local Trivy sample lockfile for safe analysis smoke.
- Run actual Trivy CLI sample scan and governed Trivy+Sigma execution/collect smoke.
- Update Detailed_PLAN.MD and FINAL_PLAN.md.

## Excluded

- No remote registry scan, DB update automation, secret upload, credentialed registry access, or production scan.
- Do not commit downloaded Trivy binary/archive.
- Do not mark the full goal complete; required six-tool final gates remain incomplete.

## Work Units

| unit | description | expected_artifact |
|---|---|---|
| WU-001 | Install and verify Trivy portable binary | local install evidence |
| WU-002 | Runtime hash pin and preset path update | redteam_v2_models.py |
| WU-003 | Safe sample scan input | trivy_workspace/package-lock.json |
| WU-004 | Regression and sanity checks | command outputs |
| WU-005 | Plan and LLM Wiki updates | Detailed_PLAN.MD, FINAL_PLAN.md, KW session |

## Verification Criteria

| criterion | evidence_required |
|---|---|
| Trivy installed | version/hash command evidence |
| Supply-chain guard checked | release tag not v0.69.4 |
| Runtime trusted | manifest hash_match/trusted_for_runner |
| Frontend runner path available | execution presets include TOOL-TRIVY-001 |
| Actual result collection | governed execution/collect smoke with Evidence candidates |
| Gate closed | QUALITY_GATE_RESULT.json |
