---
type: scope
task_id: KW-20260707-095407-Red-Team-Studio-Continue-RedTeam-AX-safe-smoke-result-to-evidence-workflow
project: Red-Team-Studio
task: Continue RedTeam AX safe smoke result to evidence workflow
created: 2026-07-07T09:54:07+09:00
---

# Scope

## Objective

Connect RedTeam2 safe local smoke version-only execution results to an installation evidence candidate workflow without treating API-executed stdout as operator-attested evidence.

## Included

- Backend projection of safe smoke stdout artifacts as `install_version_evidence_candidates`.
- Frontend RedTeam2 table for `설치 확인 결과 후보`.
- Regression coverage that high-risk tool version-only dry-run outputs remain candidate-only.
- Frontend runtime readiness contract update.
- `Detailed_PLAN.MD` and `FINAL_PLAN.md` update for this slice.

## Excluded

- No active scan execution.
- No real scanner command execution in tests.
- No automatic installation evidence registration.
- No runner unlock, Finding/Claim promotion, report export, or completion gate completion.
