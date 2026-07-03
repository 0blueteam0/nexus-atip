---
type: scope
task_id: KW-20260703-150511-Red-Team-Studio-RedTeam-AX-continue-tool-execution-integration-from-SPEC-and-Agentic-RAG-canon
project: Red-Team-Studio
task: RedTeam AX continue tool execution integration from SPEC and Agentic RAG canon
created: 2026-07-03T15:05:11+09:00
enforcement_level: L2-or-higher
---

# Scope

## User Intent

Continue the active RedTeam AX goal from the current worktree and SPEC/Agentic RAG canon. Improve the path where frontend buttons run installed tools and make the next safe implementation slice more aligned with Nuclei/OpenVAS/Trivy/SCA/npm audit/OWASP ZAP requirements.

## Included

- Inspect SPEC and Agentic RAG canon files.
- Verify current goal-completion-review remaining gaps.
- Expand RedTeam2 `안전 설치 확인 smoke` to cover Nuclei, OpenVAS, Trivy, npm audit, and OWASP ZAP version-only commands.
- Keep SCA as import-only with Korean operator guidance.
- Add regression coverage for high-risk scanner dry-run version-only smoke under partial runtime readiness.
- Update FINAL_PLAN.md, Detailed_PLAN.MD, LLM Wiki, completion audit matrix, and frontend sanity contract.

## Excluded

- Actual vulnerability scanning or active scan execution.
- Real organization OpenVAS/ZAP endpoint access.
- Final goal completion claim.
- Staging archive/runs test byproducts as source changes.

## Completion Definition

This slice is complete when code, tests, docs, KW close gate, handoff, commit, and push are complete. The overall goal remains active until real six-tool operating evidence, approvals, report export, and completion gate prove full closure.
