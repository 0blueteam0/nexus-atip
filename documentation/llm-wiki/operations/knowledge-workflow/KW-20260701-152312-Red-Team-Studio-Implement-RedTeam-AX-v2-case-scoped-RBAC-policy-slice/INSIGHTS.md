---
type: insight
status: draft
project: Red Team Studio
created: 2026-07-01T15:23:12+09:00
---

# Insight

## 관찰

## 통찰

## 제안

## 적용 가능 범위

## 후속 작업

# Insights

- Global role membership is insufficient for case-based redteam operations; approval authority must be narrowed by `case_id`.
- Artifact-level actor context should record both global `roles` and case-derived `effective_roles` to support later audit and migration to real directory groups.
- UI-generated case IDs need to be treated as first-class case identities, not as a separate report-only namespace.
- Case RBAC failure should happen before approval policy satisfaction so high-risk execution cannot be authorized by an actor outside the case.
