---
title: RedTeam AX OWASP ZAP portable install and version-only safe smoke
project: Red Team Studio
task_id: KW-20260707-135449-Red-Team-Studio-Continue-RedTeam-AX-OWASP-ZAP-install-runner-readiness
updated_at: 2026-07-07T15:25:23+09:00
status: active
---

# Scope

## Objective
Install and wire OWASP ZAP as a real local portable tool while keeping active scan blocked behind ROE/HITL. Expose only version-only safe smoke and report/service import paths.

## Included
- OWASP ZAP 2.17.0 cross-platform zip installed under Red Team Studio tools.
- Runtime ZAP profile/pin/discovery/safe smoke preset changes.
- API regression for safe smoke step and portable launcher discovery.
- Plan and final checklist updates.
- Installation manifest with hashes and policy.

## Excluded
- No ZAP daemon start, spider, active scan, attack mode, API key use, or target probing.
- No full Evidence/Finding/Claim/Report/export/completion gate closure.
