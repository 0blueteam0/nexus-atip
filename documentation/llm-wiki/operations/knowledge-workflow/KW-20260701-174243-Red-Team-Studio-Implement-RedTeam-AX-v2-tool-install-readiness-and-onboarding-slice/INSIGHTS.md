---
type: insight
status: draft
project: Red-Team-Studio
created: 2026-07-01T17:42:43+09:00
---

# Insight

## Filled Record

- Tool installation is a governance object, not just a local dependency check. It must expose source, installation mode, verification command, and post-install controls.
- API-side automatic installation would weaken auditability at this stage. Operator-run plans let the platform guide installation without silently changing the workstation.
- SCA import-only readiness is distinct from CLI wrapper readiness and should not require wrapper pinning.
- The readiness API creates a clean bridge from ToolHub onboarding to wrapper hash pinning and later governed execution.

## 관찰

## 통찰

## 제안

## 적용 가능 범위

## 후속 작업

