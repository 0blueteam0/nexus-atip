---
type: insight
status: draft
project: Red-Team-Studio
created: 2026-07-01T16:58:46+09:00
---

# Insights

## 관찰

- Tool profiles, normalizers, and governed run records existed, but a pre-run execution plan artifact was missing.
- SPEC separates plan-only, dry-run, sandbox, lab, manual, and controlled production execution.

## 통찰

- ToolExecutionPlan is the correct boundary between UI automation and actual tool execution.
- Network deny-by-default and workspace-only filesystem constraints can be verified without invoking scanners.

## 제안

- Next slice should bind actual wrapper version/hash manifests to execution plans.
- Ephemeral container execution should only consume issued execution tokens.

## 후속 작업

- Real container runner.
- CLI version pin/hash verification.
- Browser smoke for execution-plan panel.

