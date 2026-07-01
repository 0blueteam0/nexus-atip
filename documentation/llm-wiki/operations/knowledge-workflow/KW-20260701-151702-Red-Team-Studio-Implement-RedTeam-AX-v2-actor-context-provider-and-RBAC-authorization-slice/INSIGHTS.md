---
type: insight
status: draft
project: Red Team Studio
created: 2026-07-01T15:17:02+09:00
---

# Insight

## 관찰

## 통찰

## 제안

## 적용 가능 범위

## 후속 작업

# Insights

- Actor identity and requested approval role must be resolved before the model-layer approval function checks HITL policy.
- A provider-produced context should include both normalized role and all assigned roles/permissions so future case-scoped RBAC can be added without changing approval artifacts.
- UI workflows should not reuse Executive Sponsor identity for Evidence or Finding approvals; each human gate needs its own actor matching the required role.
- Local development session tokens are useful for regression tests but must remain visibly separate from external SSO/IdP integration.
